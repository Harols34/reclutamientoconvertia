
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
    
    // Create or find candidate
    let candidateId
    
    // Check if candidate exists
    const { data: existingCandidate, error: findError } = await supabaseClient
      .from('candidates')
      .select('id')
      .eq('email', email)
      .single()
    
    if (findError && findError.code !== 'PGRST116') {
      throw findError
    }
    
    if (existingCandidate) {
      candidateId = existingCandidate.id
      
      // Update candidate information
      await supabaseClient
        .from('candidates')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          resume_url: resumeUrl || existingCandidate.resume_url
        })
        .eq('id', candidateId)
    } else {
      // Create new candidate
      const { data: newCandidate, error: createError } = await supabaseClient
        .from('candidates')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          resume_url: resumeUrl
        })
        .select('id')
        .single()
      
      if (createError) throw createError
      candidateId = newCandidate.id
    }
    
    // Create application
    const { data: application, error: applicationError } = await supabaseClient
      .from('applications')
      .insert({
        candidate_id: candidateId,
        job_id: jobId,
        notes: coverLetter || null
      })
      .select()
      .single()
    
    if (applicationError) throw applicationError
    
    return new Response(
      JSON.stringify({ success: true, data: application }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
