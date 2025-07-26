import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== ENVIRONMENT CHECK ===');
    
    // Get all environment variables we need
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('Environment variables:', {
      SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: supabaseKey ? 'SET' : 'MISSING',
      RESEND_API_KEY: resendKey ? 'SET' : 'MISSING'
    });

    // Return detailed status
    const envStatus = {
      supabase_url: !!supabaseUrl,
      supabase_key: !!supabaseKey,
      resend_key: !!resendKey,
      resend_key_length: resendKey ? resendKey.length : 0,
      resend_key_starts_with: resendKey ? resendKey.substring(0, 3) : 'none'
    };

    if (!resendKey) {
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY is not configured',
          env_status: envStatus,
          solution: 'Please add the RESEND_API_KEY in Supabase Edge Function secrets',
          next_step: 'Go to Supabase Dashboard > Edge Functions > Secrets and add RESEND_API_KEY'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (resendKey.length < 10) {
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY appears to be invalid (too short)',
          env_status: envStatus,
          solution: 'Check that you copied the full API key from Resend dashboard'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test the API key with a simple request
    console.log('Testing RESEND API key...');
    const testResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProSpaces <onboarding@resend.dev>',
        to: ['paul@prospaces.co.uk'],
        subject: 'ProSpaces Invitation Test',
        html: '<h1>Test from ProSpaces</h1><p>If you receive this, Resend is working!</p>',
      }),
    });

    const testResult = await testResponse.text();
    console.log('Resend response:', { status: testResponse.status, body: testResult });

    if (testResponse.status === 200) {
      const parsedResult = JSON.parse(testResult);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'RESEND is working perfectly!',
          email_id: parsedResult.id,
          env_status: envStatus,
          next_step: 'Resend is configured correctly - we can now build the full invitation system'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Resend API returned error',
          status: testResponse.status,
          response: testResult,
          env_status: envStatus,
          solution: 'Check your Resend API key and domain verification'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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