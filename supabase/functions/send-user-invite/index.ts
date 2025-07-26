import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.log('Starting user invitation process...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, full_name, role, region }: InviteRequest = await req.json();
    console.log('Request data:', { email, role });

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'Email and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log('User already exists:', email);
      return new Response(
        JSON.stringify({ error: `User with email ${email} already exists` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate invite token for the invitation URL
    const inviteToken = crypto.randomUUID();
    
    // Create the user with Supabase Auth (reliable built-in system)
    const { data: authData, error: authError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: full_name || '',
        role: role,
        region: region || null,
        invite_token: inviteToken,
      },
      redirectTo: 'https://preview--pro-spaces-client-portal.lovable.app/auth'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user invitation' }),
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
          invite_token: inviteToken,
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
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
          method: 'supabase_reliable'
        }
      });
    }

    console.log('User invitation sent successfully:', { email, role });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User invitation sent successfully',
        user_id: authData.user?.id,
        note: 'Using reliable Supabase email system'
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