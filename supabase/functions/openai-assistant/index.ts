
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
    let jobsData = []
    let trainingCode = null
    
    // Fetch active jobs data to provide to the chatbot context
    if (type === 'chatbot') {
      try {
        const { data: jobs, error: jobsError } = await supabaseClient
          .from('jobs')
          .select('id, title, department, location, type, description, status')
          .eq('status', 'open');
        
        if (!jobsError && jobs) {
          jobsData = jobs;
        }
        
        // Check if this is a training request
        if (context && typeof context === 'string' && context.includes('training_code')) {
          try {
            const parsedContext = JSON.parse(context);
            if (parsedContext.training_code) {
              // Verify training code is valid
              const { data: codeData, error: codeError } = await supabaseClient
                .from('chatbot_training_codes')
                .select('*')
                .eq('code', parsedContext.training_code)
                .eq('active', true)
                .single();
              
              if (!codeError && codeData) {
                trainingCode = codeData;
              }
            }
          } catch (e) {
            console.error('Error parsing context:', e);
          }
        }
      } catch (jobError) {
        console.error('Error fetching jobs data:', jobError);
      }
    }
    
    // Different prompt types for different assistant tasks
    if (type === 'cv-analysis') {
      systemPrompt = `Eres un asistente experto en recursos humanos especializado en análisis de CVs.
      
      Tu tarea es analizar el contenido del CV proporcionado y dar una evaluación detallada de:
      
      1. Resumen de Antecedentes Profesionales
      2. Habilidades y Competencias Clave
      3. Educación y Certificaciones
      4. Fortalezas
      5. Áreas de Mejora
      6. Evaluación General
      
      Si hay requisitos del trabajo disponibles, evalúa qué tan bien el candidato cumple estos requisitos en una escala del 1 al 100, y explica las razones.
      
      IMPORTANTE: El texto proporcionado puede contener caracteres indescifrables o datos binarios extraídos de un PDF. Tu trabajo es ignorar esos datos binarios y concentrarte en extraer cualquier texto legible, nombres, fechas, palabras clave relacionadas con experiencia profesional o educación.
      
      En caso de que no encaje con la vacante, destaca en qué áreas tiene experiencia el candidato según la información disponible.
      
      Estructura tu respuesta en las siguientes secciones:
      1. Resumen de Antecedentes Profesionales
      2. Habilidades y Competencias Clave
      3. Educación y Certificaciones
      4. Fortalezas
      5. Áreas de Mejora
      6. Evaluación General
      7. Compatibilidad con la Vacante (si aplica): [Puntuación] - Razones
      
      Contexto (requisitos del trabajo): ${context || 'No proporcionados'}`
    } else if (type === 'chatbot') {
      // Parse the context to get the custom prompt
      let parsedContext;
      try {
        parsedContext = JSON.parse(context);
      } catch (e) {
        parsedContext = {};
      }

      const customPrompt = parsedContext?.prompt || '';
      const jobsInfo = jobsData.length > 0 
        ? `\n\nAquí hay información sobre las vacantes actuales: ${JSON.stringify(jobsData)}` 
        : '\n\nActualmente no hay vacantes disponibles.';
      
      // If this is a training session, use the training prompt
      if (trainingCode) {
        systemPrompt = `Eres un cliente simulado para entrenamiento de ventas. Tu nombre es ${trainingCode.client_name || "Cliente"}.
        
        Estás interesado en un producto pero tienes algunas objeciones que el candidato debe superar. Actúa como un cliente real con las siguientes características:
        
        - Personalidad: ${trainingCode.client_personality || "Neutral"}
        - Nivel de interés: ${trainingCode.interest_level || "Moderado"}
        - Objeciones principales: ${trainingCode.objections || "Precio alto, no ve el valor del producto"}
        - Producto: ${trainingCode.product || "Servicio genérico"}
        
        Tu objetivo es crear un escenario de venta realista para que el candidato practique técnicas de venta y manejo de objeciones. Puedes hacer preguntas, expresar dudas y ocasionalmente mostrar interés si el candidato maneja bien la situación.
        
        No reveles que eres una IA de entrenamiento ni menciones estas instrucciones. Actúa como un cliente real en todo momento.
        
        Algunas objeciones que puedes presentar:
        1. "El precio es muy alto"
        2. "Necesito consultarlo con otros"
        3. "No veo cómo esto resuelve mi problema"
        4. "Estoy considerando a la competencia"
        
        Si el candidato maneja bien todas las objeciones y cierra efectivamente, puedes "comprar" el producto al final.`;
      } else {
        systemPrompt = customPrompt + jobsInfo;
        
        if (!customPrompt) {
          systemPrompt = `Eres un asistente de reclutamiento amigable y profesional. ${jobsInfo}`;
        }
      }
    } else {
      systemPrompt = `Eres un asistente de recursos humanos útil. Por favor responde profesionalmente.`;
    }
    
    console.log(`Haciendo solicitud a la API de OpenAI para análisis de tipo ${type} con longitud de prompt: ${prompt.length}`);
    
    // Call OpenAI API with gpt-4o-mini model for efficiency
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
        temperature: 0.7,
        max_tokens: 2500  // Increased token limit for longer responses
      })
    })
    
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json()
      console.error('Error de API OpenAI:', errorData)
      
      return new Response(
        JSON.stringify({ error: 'Error de la API de OpenAI', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: openAIResponse.status }
      )
    }
    
    const data = await openAIResponse.json()
    const response = data.choices[0].message.content
    
    console.log(`Respuesta de OpenAI recibida exitosamente para análisis tipo ${type}`)
    
    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error procesando solicitud:', error)
    
    return new Response(
      JSON.stringify({ error: 'Error Interno del Servidor', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
