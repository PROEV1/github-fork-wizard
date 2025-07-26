import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== RESEND DIAGNOSTIC TEST ===');
    
    // Step 1: Check RESEND_API_KEY
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    console.log('Step 1 - API Key check:', {
      hasKey: !!resendApiKey,
      keyLength: resendApiKey ? resendApiKey.length : 0,
      keyPrefix: resendApiKey ? resendApiKey.substring(0, 7) + '...' : 'none'
    });
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY not found',
          step: 'env_check',
          debug: 'Environment variable missing'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Initialize Resend
    console.log('Step 2 - Initializing Resend...');
    const resend = new Resend(resendApiKey);
    console.log('Step 2 - Resend initialized successfully');

    // Step 3: Parse request
    const body = await req.json();
    console.log('Step 3 - Request body:', body);
    const email = body.email || 'test@example.com';

    // Step 4: Test different sender addresses
    const senderOptions = [
      'ProSpaces <onboarding@resend.dev>',
      'ProSpaces <portal@prospaces.co.uk>',
      'portal@prospaces.co.uk'
    ];

    for (let i = 0; i < senderOptions.length; i++) {
      const sender = senderOptions[i];
      console.log(`Step 4.${i + 1} - Testing sender: ${sender}`);
      
      try {
        const testResult = await resend.emails.send({
          from: sender,
          to: [email],
          subject: `Resend Test ${i + 1} - ${sender}`,
          html: `
            <h1>Resend Test Email #${i + 1}</h1>
            <p>From: ${sender}</p>
            <p>To: ${email}</p>
            <p>Time: ${new Date().toISOString()}</p>
            <p>This is a test to verify the Resend integration is working.</p>
          `,
        });

        console.log(`Step 4.${i + 1} - SUCCESS:`, testResult);
        
        if (testResult.error) {
          console.log(`Step 4.${i + 1} - Resend API error:`, testResult.error);
          continue; // Try next sender
        }

        // If we get here, this sender worked
        return new Response(
          JSON.stringify({ 
            success: true,
            message: `Email sent successfully with sender: ${sender}`,
            workingSender: sender,
            emailId: testResult.data?.id,
            step: `sender_test_${i + 1}`,
            debug: 'Found working sender configuration'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (senderError) {
        console.error(`Step 4.${i + 1} - Sender test error:`, senderError);
        continue; // Try next sender
      }
    }

    // If we get here, all senders failed
    return new Response(
      JSON.stringify({ 
        error: 'All sender addresses failed',
        step: 'all_senders_failed',
        testedSenders: senderOptions,
        debug: 'Check domain verification in Resend dashboard'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('=== DIAGNOSTIC ERROR ===', error);
    return new Response(
      JSON.stringify({ 
        error: 'Diagnostic test failed',
        message: error.message,
        stack: error.stack,
        step: 'main_error',
        debug: 'Check function logs for details'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);