import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  full_name: string;
  role: string;
  region?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== USER INVITATION REQUEST ===');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !resendKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Raw request data:', requestData);
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, full_name, role, region }: InviteRequest = requestData;
    console.log('Parsed invitation request:', { email, full_name, role, region });

    // Validate required fields
    if (!email || !full_name || !role) {
      console.error('Missing required fields:', { email: !!email, full_name: !!full_name, role: !!role });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, full_name, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create user in auth
    console.log('Creating user in Supabase Auth...');
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
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', authData.user?.id);

    // Create profile record
    console.log('Creating user profile...');
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
      // Try to clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user!.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile', details: profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send invitation email
    console.log('Sending invitation email...');
    const inviteLink = `${supabaseUrl}/auth/v1/verify?token=${authData.user!.email_confirmation_token}&type=signup&redirect_to=https://preview--pro-spaces-client-portal.lovable.app/auth`;
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProSpaces Portal <info@prospaces.co.uk>',
        to: [email],
        subject: 'You\'ve been invited to ProSpaces Portal',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to ProSpaces Portal</h1>
            <p>Hi ${full_name},</p>
            <p>You've been invited to join the ProSpaces Portal with the role of <strong>${role}</strong>.</p>
            <p>Click the button below to complete your account setup:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Complete Account Setup
              </a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">
              ${inviteLink}
            </p>
            <p>Welcome to the team!</p>
            <p>Best regards,<br>ProSpaces Team</p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.text();
    console.log('Email response:', { status: emailResponse.status, body: emailResult });

    if (emailResponse.status !== 200) {
      console.error('Failed to send email:', emailResult);
      return new Response(
        JSON.stringify({ 
          error: 'User created but failed to send invitation email',
          details: emailResult,
          user_id: authData.user!.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailData = JSON.parse(emailResult);
    console.log('Invitation sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User invited successfully',
        user_id: authData.user!.id,
        email_id: emailData.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Function failed',
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);