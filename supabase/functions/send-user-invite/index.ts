import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  full_name?: string;
  role: 'admin' | 'client' | 'engineer' | 'manager' | 'standard_office_user';
  region?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Function started successfully');

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const resend = new Resend(resendApiKey);
    console.log('Resend initialized successfully');

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Supabase client initialized');

    // Parse request
    const { email, full_name, role, region }: InviteRequest = await req.json();
    console.log('Request parsed:', { email, role });

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'Email and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate temporary password
    const generateTempPassword = (): string => {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let result = '';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const tempPassword = generateTempPassword();
    console.log('Temporary password generated');

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('profiles')
      .select('email, user_id, full_name, role, status')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error checking user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User existence check completed:', { exists: !!existingUser });

    let userId: string;

    if (existingUser) {
      // User exists, update password
      console.log('Updating existing user password');
      
      const { error: passwordError } = await supabaseClient.auth.admin.updateUserById(
        existingUser.user_id,
        { password: tempPassword }
      );

      if (passwordError) {
        console.error('Error updating password:', passwordError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = existingUser.user_id;
      console.log('Password updated successfully');
    } else {
      // Create new user
      console.log('Creating new user');
      
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || '',
          role: role,
          region: region || null,
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!authData.user) {
        return new Response(
          JSON.stringify({ error: 'User creation failed - no user data returned' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = authData.user.id;
      console.log('New user created successfully');

      // Update profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          full_name: full_name || null,
          role: role,
          region: region || null,
          status: 'active',
          invited_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
      } else {
        console.log('Profile updated successfully');
      }
    }

    // Send email
    console.log('Attempting to send email');

    try {
      const emailResponse = await resend.emails.send({
        from: 'ProSpaces <onboarding@resend.dev>',
        to: [email],
        subject: `Welcome to ProSpaces - Your ${role} account is ready`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8ac4c2;">Welcome to ProSpaces</h1>
            <p>Hello ${full_name || 'there'},</p>
            <p>Your ProSpaces account has been created with the role: <strong>${role}</strong></p>
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            <p>Please log in at: <a href="https://preview--pro-spaces-client-portal.lovable.app/auth">ProSpaces Portal</a></p>
            <p>Please change your password after your first login.</p>
          </div>
        `,
      });

      console.log('Email sent successfully:', emailResponse);

      if (emailResponse.error) {
        console.error('Resend error:', emailResponse.error);
        return new Response(
          JSON.stringify({ 
            error: `User created but email failed: ${JSON.stringify(emailResponse.error)}`,
            user_id: userId,
            temp_password: tempPassword
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return new Response(
        JSON.stringify({ 
          error: `User created but email failed: ${emailError.message}`,
          user_id: userId,
          temp_password: tempPassword
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the invitation
    try {
      await supabaseClient.rpc('log_user_action', {
        p_action_type: 'user_invited',
        p_target_user_id: userId,
        p_details: {
          email: email,
          role: role,
          region: region,
          invited_by: 'admin',
          temp_password_generated: true,
          resent: !!existingUser
        }
      });
    } catch (logError) {
      console.error('Logging error:', logError);
      // Don't fail the whole process for logging errors
    }

    console.log('User invitation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingUser ? 'Invitation email resent successfully' : 'User invitation sent successfully',
        user_id: userId,
        resent: !!existingUser
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: `Function failed: ${error.message}`,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);