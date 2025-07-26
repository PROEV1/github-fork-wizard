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
    console.log('=== SIMPLE RESEND TEST ===');
    
    // Check API key
    const apiKey = Deno.env.get('RESEND_API_KEY');
    console.log('API Key status:', {
      exists: !!apiKey,
      length: apiKey?.length || 0
    });
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY missing',
          solution: 'Please configure the RESEND_API_KEY secret in Supabase'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try manual fetch to Resend API instead of using the npm package
    const body = await req.json();
    const email = body.email || 'paul@prospaces.co.uk';
    
    console.log('Trying direct API call to Resend...');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProSpaces <onboarding@resend.dev>',
        to: [email],
        subject: 'ProSpaces Test Email - Direct API',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h1 style="color: #8ac4c2;">ProSpaces Test Email</h1>
            <p>This is a test email sent directly via Resend API.</p>
            <p>Time: ${new Date().toISOString()}</p>
            <p>If you receive this, the Resend integration is working!</p>
          </div>
        `,
      }),
    });

    const result = await response.json();
    console.log('Resend API response:', { status: response.status, result });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Resend API failed',
          status: response.status,
          details: result,
          solution: 'Check API key and domain configuration'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email sent successfully via direct API!',
        emailId: result.id,
        solution: 'Resend is working - we can now build the full invitation system'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Function failed',
        message: error.message,
        solution: 'Check function logs for details'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);