
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
    
    // Create or find candidate
    let candidateId
    
    // Check if candidate exists
    const { data: existingCandidate, error: findError } = await supabaseAdmin
      .from('candidates')
      .select('id, resume_url')
      .eq('email', email)
      .maybeSingle()
    
    if (findError) {
      console.error('Error finding candidate:', findError)
      throw new Error('Error al buscar candidato existente')
    }
    
    // Format phone number correctly
    const formattedPhone = phoneCountry && phone ? `+${phoneCountry}${phone}` : null
    console.log('Formatted phone:', formattedPhone)
    
    if (existingCandidate) {
      console.log('Existing candidate found:', existingCandidate.id)
      candidateId = existingCandidate.id
      
      // Update candidate information
      const { error: updateError } = await supabaseAdmin
        .from('candidates')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: formattedPhone,
          resume_url: resumeUrl || existingCandidate.resume_url
        })
        .eq('id', candidateId)
        
      if (updateError) {
        console.error('Error updating candidate:', updateError)
        throw new Error('Error al actualizar información del candidato')
      }
      
      console.log('Candidate updated successfully')
    } else {
      console.log('Creating new candidate')
      // Create new candidate
      const { data: newCandidate, error: createError } = await supabaseAdmin
        .from('candidates')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: formattedPhone,
          resume_url: resumeUrl
        })
        .select('id')
        .single()
      
      if (createError) {
        console.error('Error creating candidate:', createError)
        throw new Error('Error al crear candidato')
      }
      
      if (!newCandidate) {
        console.error('Candidate created but no ID returned')
        throw new Error('Error al crear candidato: no se devolvió ID')
      }
      
      candidateId = newCandidate.id
      console.log('New candidate created with ID:', candidateId)
    }
    
    // Check if application already exists for this candidate and job
    const { data: existingApplication } = await supabaseAdmin
      .from('applications')
      .select('id')
      .match({ candidate_id: candidateId, job_id: jobId })
      .maybeSingle()
      
    if (existingApplication) {
      console.log('Application already exists:', existingApplication.id)
      
      // Update existing application
      const { data: updatedApplication, error: updateError } = await supabaseAdmin
        .from('applications')
        .update({
          notes: coverLetter || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingApplication.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating application:', updateError)
        throw new Error('Error al actualizar aplicación existente')
      }
      
      console.log('Application updated successfully:', updatedApplication?.id)
      
      return new Response(
        JSON.stringify({ success: true, data: updatedApplication }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    // Create new application
    console.log('Creating application with candidate_id:', candidateId, 'job_id:', jobId)
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('applications')
      .insert({
        candidate_id: candidateId,
        job_id: jobId,
        notes: coverLetter || null,
        status: 'new'
      })
      .select()
      .single()
    
    if (applicationError) {
      console.error('Error creating application:', applicationError)
      throw new Error('Error al crear la aplicación')
    }
    
    if (!application) {
      console.error('Application created but no data returned')
      throw new Error('Error: no se devolvieron datos de la aplicación')
    }
    
    console.log('Application created successfully:', application.id)
    
    return new Response(
      JSON.stringify({ success: true, data: application }),
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
