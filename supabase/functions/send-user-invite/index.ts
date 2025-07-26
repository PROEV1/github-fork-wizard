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
    
    // Just test if we can send a simple email first
    const resendKey = Deno.env.get('RESEND_API_KEY');
    console.log('Resend key exists:', !!resendKey);
    
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'No Resend API key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Send a simple test email
    console.log('Attempting to send email...');
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProSpaces Portal <info@prospaces.co.uk>',
        to: ['paul@prospaces.co.uk'],
        subject: 'Test Email from ProSpaces',
        html: '<h1>Test</h1><p>This is a test email to verify Resend is working.</p>',
      }),
    });

    const emailResult = await emailResponse.text();
    console.log('Email response status:', emailResponse.status);
    console.log('Email response body:', emailResult);

    if (emailResponse.status === 200) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Test email sent successfully',
          email_response: emailResult
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Email sending failed',
          status: emailResponse.status,
          response: emailResult
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Function failed',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);