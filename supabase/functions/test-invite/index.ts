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
    console.log('Simple function start');
    
    // Just parse the body to see if that works
    const body = await req.json();
    console.log('Body parsed successfully:', body);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Simple function works',
        received: body
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in simple function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Simple function failed',
        message: error.message
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
};

serve(handler);