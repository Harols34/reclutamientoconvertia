
// This function creates helper stored procedures for fetching training data
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Creating database functions for training data...');

    // Create function to get complete sessions data
    const { error: fnError } = await supabase.rpc('create_get_complete_training_sessions_function');
    
    if (fnError) {
      console.error('Error creating function:', fnError);
      throw fnError;
    }
    
    // Create function to enable realtime for training tables
    const { error: realtimeError } = await supabase.rpc('create_enable_realtime_function');
    
    if (realtimeError) {
      console.error('Error creating realtime function:', realtimeError);
      throw realtimeError;
    }
    
    // Enable realtime for training tables
    const { error: enableError } = await supabase.rpc('enable_realtime_for_training');
    
    if (enableError) {
      console.error('Error enabling realtime:', enableError);
      throw enableError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Training database functions created successfully"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Error updating training functions: ${error.message}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
