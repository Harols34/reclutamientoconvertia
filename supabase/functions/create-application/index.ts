
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
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
    
    console.log('Application data received:', { firstName, lastName, email, jobId, resumeUrl })
    
    // Create or find candidate
    let candidateId
    
    // Check if candidate exists
    const { data: existingCandidate, error: findError } = await supabaseClient
      .from('candidates')
      .select('id, resume_url')
      .eq('email', email)
      .maybeSingle()
    
    if (findError) {
      console.error('Error finding candidate:', findError)
      throw findError
    }
    
    if (existingCandidate) {
      console.log('Existing candidate found:', existingCandidate.id)
      candidateId = existingCandidate.id
      
      // Update candidate information
      const { error: updateError } = await supabaseClient
        .from('candidates')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: `${phoneCountry}${phone}`,
          resume_url: resumeUrl || existingCandidate.resume_url
        })
        .eq('id', candidateId)
        
      if (updateError) {
        console.error('Error updating candidate:', updateError)
        throw updateError
      }
    } else {
      console.log('Creating new candidate')
      // Create new candidate
      const { data: newCandidate, error: createError } = await supabaseClient
        .from('candidates')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: `${phoneCountry}${phone}`,
          resume_url: resumeUrl
        })
        .select('id')
        .single()
      
      if (createError) {
        console.error('Error creating candidate:', createError)
        throw createError
      }
      
      candidateId = newCandidate.id
      console.log('New candidate created with ID:', candidateId)
    }
    
    // Create application
    console.log('Creating application with candidate_id:', candidateId, 'job_id:', jobId)
    const { data: application, error: applicationError } = await supabaseClient
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
      throw applicationError
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
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
