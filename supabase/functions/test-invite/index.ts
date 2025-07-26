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
    console.log('=== USER INVITATION START ===');
    
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    const { email, full_name, role, region } = body;
    
    // Validate required fields
    if (!email || !full_name || !role) {
      console.error('Missing required fields:', { email: !!email, full_name: !!full_name, role: !!role });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: email, full_name, and role are required',
          success: false
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get environment variables
    console.log('Checking environment variables...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasResendKey: !!resendKey
    });
    
    if (!supabaseUrl || !supabaseKey || !resendKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing environment variables',
          success: false
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if user already exists in profiles
    console.log('Checking if user already exists in profiles...');
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('email, user_id')
      .eq('email', email)
      .maybeSingle();
    
    if (profileCheckError) {
      console.error('Error checking existing profile:', profileCheckError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error while checking existing user',
          success: false
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (existingProfile) {
      console.log('User already exists in profiles:', existingProfile.email);
      return new Response(
        JSON.stringify({ 
          error: `User with email ${email} already exists in the system`,
          success: false
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create user in auth
    console.log('Creating user in auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name, role, region: region || '' },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create user: ${authError.message}`,
          success: false
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User created in auth:', authData.user?.id);

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
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user!.id);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create user profile: ${profileError.message}`,
          success: false
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Profile created successfully');

    // Send invitation email
    console.log('Sending email via Resend...');
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
            <p>You've been invited to join ProSpaces Portal with the role of <strong>${role}</strong>.</p>
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
    console.log('Email response status:', emailResponse.status);
    console.log('Email response:', emailResult);
    
    if (emailResponse.status !== 200) {
      console.error('Email failed:', emailResult);
      return new Response(
        JSON.stringify({ 
          error: `Failed to send invitation email: ${emailResult}`,
          success: false
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Function error:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: `Internal server error: ${error.message}`,
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);