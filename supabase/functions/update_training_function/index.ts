
// This file will be deployed as a Supabase Edge Function
// to update the get_complete_training_session SQL function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // SQL function to update - Modified to accept NULL parameter
    const sql = `
    CREATE OR REPLACE FUNCTION public.get_complete_training_session(p_session_id uuid DEFAULT NULL)
    RETURNS TABLE(id uuid, candidate_name text, started_at timestamp with time zone, ended_at timestamp with time zone, score numeric, feedback text, public_visible boolean, training_code text, messages json, strengths text, areas_to_improve text, recommendations text)
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
      RETURN QUERY
      SELECT 
        ts.id,
        ts.candidate_name,
        ts.started_at,
        ts.ended_at,
        ts.score,
        ts.feedback,
        ts.public_visible,
        tc.code as training_code,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', tm.id,
              'sender_type', tm.sender_type,
              'content', tm.content,
              'sent_at', tm.sent_at
            ) ORDER BY tm.sent_at ASC
          )
          FROM training_messages tm
          WHERE tm.session_id = ts.id), 
          '[]'::json
        ) AS messages,
        te.strengths,
        te.areas_to_improve,
        te.recommendations
      FROM training_sessions ts
      JOIN training_codes tc ON ts.training_code_id = tc.id
      LEFT JOIN training_evaluations te ON te.session_id = ts.id
      WHERE (p_session_id IS NULL OR ts.id = p_session_id)
      ORDER BY ts.started_at DESC;
    END;
    $function$;
    `;

    // Execute the SQL statement
    const { data, error } = await supabase.rpc("postgres_query", { query: sql });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "SQL function updated successfully",
        data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        error
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
