
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2'

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
    console.log("Starting create-application function")
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') // Using service role key to bypass RLS
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Error de configuración del servidor')
    }
    
    // Verify the authorization header is present
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      throw new Error('Se requiere autenticación para esta operación')
    }
    
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    const body = await req.json()
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      phoneCountry,
      jobId,
      coverLetter,
      resumeUrl
    } = body
    
    console.log('Application data received:', { 
      firstName, 
      lastName, 
      email, 
      phone: phone ? '(hidden for privacy)' : null, 
      phoneCountry,
      jobId,
      resumeUrl: resumeUrl ? 'Resume URL provided' : 'No resume URL'
    })
    
    if (!firstName || !lastName || !email || !jobId) {
      console.error('Missing required fields:', { 
        firstName: !!firstName, 
        lastName: !!lastName, 
        email: !!email, 
        jobId: !!jobId 
      })
      throw new Error('Faltan campos requeridos para la aplicación')
    }
    
    // Verificar que el trabajo existe
    const { data: jobExists, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, type')
      .eq('id', jobId)
      .single()
      
    if (jobError || !jobExists) {
      console.error('Job not found:', jobId, jobError)
      throw new Error('La vacante seleccionada no existe')
    }

    // Format phone number correctly
    const formattedPhone = phoneCountry && phone ? `+${phoneCountry}${phone}` : null
    console.log('Formatted phone:', formattedPhone)
    
    // Usar la función create_or_update_application
    const { data, error } = await supabaseAdmin.rpc(
      'create_or_update_application',
      {
        p_first_name: firstName,
        p_last_name: lastName,
        p_email: email,
        p_phone: formattedPhone || '',
        p_phone_country: phoneCountry || '',
        p_job_id: jobId,
        p_cover_letter: coverLetter || '',
        p_job_type: jobExists.type || 'full-time',
        p_resume_url: resumeUrl || ''
      }
    )
    
    if (error) {
      console.error('Error calling create_or_update_application function:', error)
      throw new Error('Error al crear o actualizar la aplicación')
    }
    
    if (!data) {
      console.error('Function returned no data')
      throw new Error('Error al crear la aplicación: no se devolvió ID')
    }
    
    console.log('Application created/updated successfully with ID:', data)
    
    // Obtener detalles de la aplicación
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*, candidate:candidate_id(*)')
      .eq('id', data)
      .single()
      
    if (fetchError) {
      console.error('Error fetching application details:', fetchError)
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: application || { id: data }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Error in create-application function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error al enviar la aplicación',
        details: typeof error === 'object' ? Object.getOwnPropertyNames(error).reduce((acc, key) => {
          acc[key] = error[key];
          return acc;
        }, {}) : null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
