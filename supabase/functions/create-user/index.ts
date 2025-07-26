import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name, role, region } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Check if user exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();
      
    if (existing) {
      return new Response(
        JSON.stringify({ error: 'User already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create user
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name, role, region: region || '' },
    });

    if (error) throw error;

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.user!.id,
        email,
        full_name,
        role,
        region: region || '',
        status: 'active',
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(user.user!.id);
      throw profileError;
    }

    return new Response(
      JSON.stringify({ success: true, user_id: user.user!.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});