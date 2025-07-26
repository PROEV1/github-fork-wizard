import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== INVITE FUNCTION START ===');
    
    // Parse request body
    const requestData = await req.json();
    console.log('Request data:', requestData);
    
    const { email, full_name, role, region } = requestData;
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !resendKey) {
      throw new Error('Missing environment variables');
    }
    
    console.log('Environment variables OK');
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create user in auth
    console.log('Creating user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        region: region || '',
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    console.log('User created:', authData.user?.id);

    // Create profile record
    console.log('Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user!.id,
        email,
        full_name,
        role,
        region: region || '',
        status: 'active',
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Clean up auth user
      await supabase.auth.admin.deleteUser(authData.user!.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    console.log('Profile created successfully');

    // Send invitation email
    console.log('Sending email...');
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProSpaces Portal <info@prospaces.co.uk>',
        to: [email],
        subject: 'Welcome to ProSpaces Portal',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to ProSpaces Portal</h1>
            <p>Hi ${full_name},</p>
            <p>You've been invited to join the ProSpaces Portal with the role of <strong>${role}</strong>.</p>
            <p>To get started, please sign in at:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://preview--pro-spaces-client-portal.lovable.app/auth" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Sign In to Portal
              </a>
            </div>
            <p>Your email: <strong>${email}</strong></p>
            <p>You can set your password when you first sign in.</p>
            <p>Best regards,<br>ProSpaces Team</p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.text();
    console.log('Email status:', emailResponse.status);
    console.log('Email result:', emailResult);

    if (emailResponse.status !== 200) {
      throw new Error(`Email failed: ${emailResult}`);
    }

    console.log('SUCCESS - User created and email sent');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User invited successfully',
        user_id: authData.user!.id
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
};

serve(handler);