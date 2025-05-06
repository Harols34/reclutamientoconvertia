
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

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
    const { prompt, type, context } = await req.json()
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Get the OpenAI API key from Supabase secrets
    const apiKey = Deno.env.get('OPENAI')
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    let systemPrompt = ''
    
    // Different prompt types for different assistant tasks
    if (type === 'cv-analysis') {
      systemPrompt = `You are an expert HR assistant specialized in analyzing CVs.
      
      Your task is to analyze the provided CV and give a detailed assessment of the candidate's skills, 
      experience, strengths, and potential areas where they might need improvement.
      
      If job requirements context is provided, you should assess how well the candidate matches these requirements.
      
      Structure your response in the following sections:
      1. Summary of Professional Background
      2. Key Skills and Competencies
      3. Education and Certifications
      4. Strengths
      5. Areas for Development
      6. Overall Assessment
      7. Match to Job Requirements (if applicable)
      
      Context (job requirements): ${context || 'Not provided'}`
    } else {
      systemPrompt = `You are a helpful HR assistant. Please respond professionally.`
    }
    
    console.log(`Making OpenAI API request for ${type} analysis with prompt length: ${prompt.length}`)
    
    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // Using the newer, more efficient model
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    })
    
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json()
      console.error('OpenAI API error:', errorData)
      
      return new Response(
        JSON.stringify({ error: 'Error from OpenAI API', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: openAIResponse.status }
      )
    }
    
    const data = await openAIResponse.json()
    const response = data.choices[0].message.content
    
    console.log(`Successfully received OpenAI response for ${type} analysis`)
    
    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
