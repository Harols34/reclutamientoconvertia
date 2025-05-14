
-- Function to get complete training session data
CREATE OR REPLACE FUNCTION public.create_get_complete_training_sessions_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create function to get complete training sessions data
  CREATE OR REPLACE FUNCTION public.get_complete_training_sessions()
  RETURNS TABLE(
    id uuid, 
    candidate_name text, 
    started_at timestamp with time zone, 
    ended_at timestamp with time zone, 
    score numeric, 
    feedback text, 
    public_visible boolean, 
    training_code text, 
    messages json,
    strengths text, 
    areas_to_improve text, 
    recommendations text
  )
  LANGUAGE plpgsql
  AS $inner_function$
  BEGIN
    RETURN QUERY
    SELECT 
      ts.id,
      ts.candidate_name,
      ts.started_at,
      ts.ended_at,
      ts.score,
      ts.feedback,
      COALESCE(ts.public_visible, false) as public_visible,
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
    ORDER BY ts.started_at DESC;
  END;
  $inner_function$;
END;
$$;

-- Function to create the realtime enabler function
CREATE OR REPLACE FUNCTION public.create_enable_realtime_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create function to enable realtime for training tables
  CREATE OR REPLACE FUNCTION public.enable_realtime_for_training()
  RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $inner_function$
BEGIN
  -- Enable full replica identity for tables
  ALTER TABLE public.training_sessions REPLICA IDENTITY FULL;
  ALTER TABLE public.training_messages REPLICA IDENTITY FULL;
  ALTER TABLE public.training_evaluations REPLICA IDENTITY FULL;
  
  -- Add tables to the publication (creating it if it doesn't exist)
  BEGIN
    CREATE PUBLICATION supabase_realtime FOR TABLE 
      public.training_sessions, 
      public.training_messages, 
      public.training_evaluations;
  EXCEPTION WHEN duplicate_object THEN
    -- If publication already exists, add tables to it
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.training_sessions, 
      public.training_messages, 
      public.training_evaluations;
  END;
END;
$inner_function$;
END;
$$;
