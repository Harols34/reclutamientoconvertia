
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Check if table exists first
    const { error: checkError } = await supabaseAdmin.from('chatbot_training_codes').select('id').limit(1)
    
    // If table doesn't exist, create it
    if (checkError && checkError.code === '42P01') { // Table does not exist
      // Execute SQL to create table
      const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.chatbot_training_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code TEXT UNIQUE NOT NULL,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            expires_at TIMESTAMP WITH TIME ZONE,
            client_name TEXT,
            client_personality TEXT,
            interest_level TEXT,
            objections TEXT,
            product TEXT,
            created_by UUID REFERENCES auth.users(id)
          );
          
          -- Add policy for admin access
          ALTER TABLE public.chatbot_training_codes ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Admins can manage codes" ON public.chatbot_training_codes
            USING (true)
            WITH CHECK (true);
        `
      })
      
      if (createError) {
        throw createError
      }
      
      // Insert initial test code
      const { error: insertError } = await supabaseAdmin
        .from('chatbot_training_codes')
        .insert({
          code: 'TRAINING123',
          client_name: 'Juan Pérez',
          client_personality: 'Amigable pero cauteloso',
          interest_level: 'Medio',
          objections: 'Precio alto, dudas sobre el servicio',
          product: 'Software de gestión empresarial'
        })
      
      if (insertError) {
        throw insertError
      }
      
      return new Response(
        JSON.stringify({ message: 'Tabla chatbot_training_codes creada con éxito' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ message: 'La tabla chatbot_training_codes ya existe' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
