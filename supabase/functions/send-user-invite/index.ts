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
    console.log('Function started');

    // Test 1: Basic function execution
    const body = await req.json();
    console.log('Request body:', body);

    // Test 2: Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasResendKey: !!resendKey,
      supabaseUrl: supabaseUrl ? 'configured' : 'missing',
      resendKeyLength: resendKey ? resendKey.length : 0
    });

    if (!resendKey) {
      console.error('RESEND_API_KEY is missing from environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY not configured',
          debug: 'Environment variable missing - please check Supabase Edge Function secrets',
          hasKey: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test 3: Try to import and initialize Resend
    console.log('Attempting to import Resend...');
    const { Resend } = await import("npm:resend@2.0.0");
    console.log('Resend imported successfully');
    
    const resend = new Resend(resendKey);
    console.log('Resend initialized successfully');

    // Test 4: Try to send a simple email
    console.log('Attempting to send test email...');
    const emailResult = await resend.emails.send({
      from: 'ProSpaces <onboarding@resend.dev>',
      to: [body.email || 'test@example.com'],
      subject: 'Test Email from ProSpaces',
      html: '<p>This is a test email to verify the Resend integration is working.</p>',
    });

    console.log('Email result:', emailResult);

    if (emailResult.error) {
      return new Response(
        JSON.stringify({ 
          error: 'Email sending failed',
          resendError: emailResult.error,
          debug: 'Resend API returned error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test email sent successfully',
        emailId: emailResult.data?.id,
        debug: 'All systems working'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Function failed',
        message: error.message,
        stack: error.stack,
        debug: 'Caught in main try/catch'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);