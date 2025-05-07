
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
    
    // Special handling for CV text extraction
    if (type === 'extract-cv-text') {
      console.log('Extracción de texto solicitada para URL: ', prompt);
      
      let resumeText = '';
      
      try {
        // Extract filename from URL
        let filename = prompt;
        if (prompt.includes('/')) {
          const parts = prompt.split('/');
          filename = parts[parts.length - 1];
        }
        
        console.log('Intentando leer archivo:', filename);
        
        // Try to download the file from storage
        const { data: fileData, error: fileError } = await supabaseClient
          .storage
          .from('resumes')
          .download(filename);
        
        if (fileError) {
          console.error('Error descargando CV para extracción:', fileError);
          throw fileError;
        }
        
        if (!fileData) {
          throw new Error('No se pudo descargar el CV');
        }
        
        // Convert PDF to text using OpenAI
        resumeText = await extractTextWithOpenAI(apiKey, fileData);
        
        return new Response(
          JSON.stringify({ response: resumeText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error extrayendo texto del CV:', error);
        return new Response(
          JSON.stringify({ error: 'Error extracting CV text', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }
    
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
      
      IMPORTANTE: Si el texto proporcionado parece contener datos binarios o no es legible, extrae cualquier información útil que puedas encontrar, como nombres, fechas, palabras clave relacionadas con experiencia profesional o educación. En caso de no encontrar suficiente información, proporciona un análisis general basado en lo que puedas inferir.
      
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
      
      systemPrompt = customPrompt + jobsInfo;
      
      if (!customPrompt) {
        systemPrompt = `Eres un asistente de reclutamiento amigable y profesional. ${jobsInfo}`;
      }
    } else {
      systemPrompt = `Eres un asistente de recursos humanos útil. Por favor responde profesionalmente.`;
    }
    
    console.log(`Haciendo solicitud a la API de OpenAI para análisis de tipo ${type} con longitud de prompt: ${prompt.length}`);
    
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
        temperature: 0.7,
        max_tokens: 2500  // Aumentar el límite de tokens para permitir respuestas más largas
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

// Function to extract text from PDF using OpenAI
async function extractTextWithOpenAI(apiKey: string, fileData: Blob): Promise<string> {
  try {
    console.log("Usando OpenAI para extraer texto");

    // Convert blob to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Use OpenAI's vision model to extract text from PDF
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Eres un asistente experto en extraer información de documentos. Tu tarea es extraer todo el texto e información relevante del documento que te mostraré. El documento es un CV y necesito que extraigas toda la información que encuentres incluyendo: datos personales, experiencia laboral, habilidades, educación, certificaciones y cualquier otra información relevante. Presenta la información de forma estructurada y completa."
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64data}`
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });
    
    if (!visionResponse.ok) {
      const errorData = await visionResponse.json();
      console.error("Error en API de OpenAI Vision:", errorData);
      throw new Error(`Error en API Vision: ${JSON.stringify(errorData)}`);
    }
    
    const visionResult = await visionResponse.json();
    const extractedText = visionResult.choices[0].message.content;
    
    console.log("Texto extraído con éxito, longitud:", extractedText.length);
    return extractedText;
  } catch (error) {
    console.error("Error en extractTextWithOpenAI:", error);
    throw error;
  }
}
