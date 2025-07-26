import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

// Generate secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Role-specific email templates
function getEmailTemplate(role: string, fullName: string, email: string, tempPassword: string, loginUrl: string) {
  const roleData = {
    admin: {
      title: 'Welcome to ProSpaces Admin Portal',
      description: 'You have been invited to join ProSpaces as an Administrator. You will have full access to manage users, orders, products, and system settings.',
      features: ['Complete system administration', 'User management', 'Order oversight', 'Product catalog management', 'System settings configuration']
    },
    engineer: {
      title: 'Welcome to ProSpaces Engineer Dashboard',
      description: 'You have been invited to join ProSpaces as an Engineer. You will be able to manage job assignments, upload photos, and update installation progress.',
      features: ['Job assignment management', 'Installation progress tracking', 'Photo uploads', 'Client communication', 'Mobile-friendly access']
    },
    manager: {
      title: 'Welcome to ProSpaces Management Console',
      description: 'You have been invited to join ProSpaces as a Manager. You will be able to oversee projects, manage teams, and access comprehensive reporting.',
      features: ['Project oversight', 'Team management', 'Performance reporting', 'Resource allocation', 'Progress monitoring']
    },
    standard_office_user: {
      title: 'Welcome to ProSpaces Team Portal',
      description: 'You have been invited to join ProSpaces as a Team Member. You will have access to collaborate on projects and manage daily tasks.',
      features: ['Project collaboration', 'Task management', 'Document access', 'Team communication', 'Progress updates']
    }
  };

  const data = roleData[role as keyof typeof roleData] || roleData.standard_office_user;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5efe8; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #8ac4c2, #d1d9b0); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .header-text { color: white; font-size: 18px; margin: 0; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 20px; color: #333; margin-bottom: 20px; }
        .description { color: #666; line-height: 1.6; margin-bottom: 30px; }
        .credentials-box { background-color: #f8f9fa; border: 2px solid #8ac4c2; border-radius: 8px; padding: 25px; margin: 30px 0; }
        .credentials-title { font-size: 18px; color: #333; margin-bottom: 15px; font-weight: 600; }
        .credential-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .credential-label { font-weight: 600; color: #555; }
        .credential-value { color: #333; font-family: monospace; background: #e9ecef; padding: 2px 6px; border-radius: 4px; }
        .features { margin: 30px 0; }
        .features-title { font-size: 16px; color: #333; margin-bottom: 15px; font-weight: 600; }
        .feature-list { list-style: none; padding: 0; }
        .feature-item { color: #666; margin-bottom: 8px; padding-left: 20px; position: relative; }
        .feature-item:before { content: "✓"; color: #8ac4c2; font-weight: bold; position: absolute; left: 0; }
        .login-button { display: inline-block; background: linear-gradient(135deg, #8ac4c2, #d1d9b0); color: white; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
        .important-note { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ProSpaces</div>
          <div class="header-text">${data.title}</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${fullName || 'there'},</div>
          
          <div class="description">
            ${data.description}
          </div>
          
          <div class="credentials-box">
            <div class="credentials-title">Your Login Credentials</div>
            <div class="credential-row">
              <span class="credential-label">Email:</span>
              <span class="credential-value">${email}</span>
            </div>
            <div class="credential-row">
              <span class="credential-label">Temporary Password:</span>
              <span class="credential-value">${tempPassword}</span>
            </div>
          </div>
          
          <div class="important-note">
            <strong>Important:</strong> Please change your password after your first login for security purposes.
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="login-button">Access ProSpaces Portal</a>
          </div>
          
          <div class="features">
            <div class="features-title">What you can do with your account:</div>
            <ul class="feature-list">
              ${data.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
            </ul>
          </div>
          
          <div style="margin-top: 30px; color: #666; font-size: 14px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </div>
        </div>
        
        <div class="footer">
          <div style="margin-bottom: 10px;">
            <strong>ProSpaces</strong> - Professional Space Solutions
          </div>
          <div>
            This email was sent because you were invited to join our platform.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, full_name, role, region }: InviteRequest = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'Email and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseClient
      .from('profiles')
      .select('email, user_id, full_name, role, status')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log('User already exists, resending invitation email:', email);
      
      // Generate new temporary password for existing user
      const tempPassword = generateTempPassword();
      
      // Update user with new password
      const { error: passwordError } = await supabaseClient.auth.admin.updateUserById(
        existingUser.user_id,
        { password: tempPassword }
      );

      if (passwordError) {
        console.error('Error updating user password:', passwordError);
        return new Response(
          JSON.stringify({ error: 'User exists but failed to update password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send invitation email for existing user
      const loginUrl = 'https://preview--pro-spaces-client-portal.lovable.app/auth';
      const emailHtml = getEmailTemplate(existingUser.role, existingUser.full_name || '', email, tempPassword, loginUrl);
      
      try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
          console.error('RESEND_API_KEY not configured');
          throw new Error('RESEND_API_KEY not configured');
        }

        const emailResponse = await resend.emails.send({
          from: 'ProSpaces <onboarding@resend.dev>',
          to: [email],
          subject: `ProSpaces Account - Updated Credentials`,
          html: emailHtml,
        });

        console.log('Resent invitation email successfully:', emailResponse);
        
        if (emailResponse.error) {
          console.error('Resend API error:', emailResponse.error);
          throw new Error(`Email sending failed: ${JSON.stringify(emailResponse.error)}`);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Invitation email resent successfully',
            user_id: existingUser.user_id,
            resent: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      } catch (emailError) {
        console.error('Error resending invitation email:', emailError);
        return new Response(
          JSON.stringify({ 
            error: `User exists but failed to send invitation email: ${emailError.message}`,
            user_id: existingUser.user_id,
            temp_password: tempPassword
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate secure temporary password
    const tempPassword = generateTempPassword();
    
    // Create the user with Supabase Auth using the temp password
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
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the profile with additional information
    if (authData.user) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          full_name: full_name || null,
          role: role,
          region: region || null,
          status: 'active',
          invited_at: new Date().toISOString(),
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Send branded invitation email
      const loginUrl = 'https://preview--pro-spaces-client-portal.lovable.app/auth';
      const emailHtml = getEmailTemplate(role, full_name || '', email, tempPassword, loginUrl);
      
      try {
        // Check if RESEND_API_KEY is configured
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
          console.error('RESEND_API_KEY not configured');
          throw new Error('RESEND_API_KEY not configured');
        }

        const emailResponse = await resend.emails.send({
          from: 'ProSpaces <onboarding@resend.dev>',
          to: [email],
          subject: `Welcome to ProSpaces - Your ${role} account is ready`,
          html: emailHtml,
        });

        console.log('Branded invitation email sent successfully:', emailResponse);
        
        if (emailResponse.error) {
          console.error('Resend API error:', emailResponse.error);
          throw new Error(`Email sending failed: ${emailResponse.error.message}`);
        }
      } catch (emailError) {
        console.error('Error sending branded email:', emailError);
        
        // Return error response if email fails since it's critical for user invitation
        return new Response(
          JSON.stringify({ 
            error: `User account created but email invitation failed: ${emailError.message}. Please contact the user manually with their credentials.`,
            user_id: authData.user?.id,
            temp_password: tempPassword,
            partial_success: true
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the invitation
      await supabaseClient.rpc('log_user_action', {
        p_action_type: 'user_invited',
        p_target_user_id: authData.user.id,
        p_details: {
          email: email,
          role: role,
          region: region,
          invited_by: 'admin',
          temp_password_generated: true
        }
      });
    }

    console.log('User invitation sent successfully:', { email, role });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User invitation sent successfully with branded email',
        user_id: authData.user?.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-user-invite function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);