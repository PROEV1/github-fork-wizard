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
    console.log('=== FUNCTION START ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Read the raw body
    const rawBody = await req.text();
    console.log('Raw body:', rawBody);
    
    // Try to parse JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
      console.log('Parsed body:', parsedBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON', 
          rawBody: rawBody.substring(0, 100),
          parseError: parseError.message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      resendKey: !!resendKey
    });
    
    if (!supabaseUrl || !supabaseKey || !resendKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Missing environment variables',
          missing: {
            supabaseUrl: !supabaseUrl,
            supabaseKey: !supabaseKey,
            resendKey: !resendKey
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract fields
    const { email, full_name, role, region } = parsedBody;
    console.log('Extracted fields:', { email, full_name, role, region });
    
    // Validate required fields
    if (!email) {
      console.error('Missing email');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!full_name) {
      console.error('Missing full_name');
      return new Response(
        JSON.stringify({ error: 'Full name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!role) {
      console.error('Missing role');
      return new Response(
        JSON.stringify({ error: 'Role is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('All validations passed, returning success');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Validation passed',
        receivedData: { email, full_name, role, region }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Function failed',
        message: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);