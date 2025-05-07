
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
      
      try {
        // If the prompt is a URL, we need to download the PDF file first
        if (prompt.startsWith('http')) {
          console.log('URL detectada, descargando PDF...');
          
          // Extract filename from the URL
          let filename = prompt;
          if (prompt.includes('/')) {
            const parts = prompt.split('/');
            filename = parts[parts.length - 1];
          }
          
          // First try to get the file content directly from the URL
          const pdfResponse = await fetch(prompt);
          if (!pdfResponse.ok) {
            throw new Error(`No se pudo descargar el PDF desde la URL: ${pdfResponse.status}`);
          }
          
          const fileData = await pdfResponse.blob();
          
          // Extract the text from the PDF using OpenAI's Vision capabilities
          const extractedText = await extractTextFromPDFWithVision(apiKey, fileData);
          
          return new Response(
            JSON.stringify({ response: extractedText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } 
        // If not a URL, assume it's a filename in storage
        else {
          console.log('Intentando leer archivo de storage:', prompt);
          
          // Try to download the file from storage
          const { data: fileData, error: fileError } = await supabaseClient
            .storage
            .from('resumes')
            .download(prompt);
          
          if (fileError) {
            console.error('Error descargando CV para extracción:', fileError);
            throw fileError;
          }
          
          if (!fileData) {
            throw new Error('No se pudo descargar el CV');
          }
          
          // Extract text from the PDF
          const extractedText = await extractTextFromPDFWithVision(apiKey, fileData);
          
          return new Response(
            JSON.stringify({ response: extractedText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
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

// Improved function to extract text from PDF using OpenAI's vision API
async function extractTextFromPDFWithVision(apiKey: string, fileData: Blob): Promise<string> {
  try {
    console.log("Extrayendo texto del PDF con OpenAI Vision...");
    
    // Convert blob to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Create a base64 string
    let base64String = '';
    for (let i = 0; i < uint8Array.length; i++) {
      base64String += String.fromCharCode(uint8Array[i]);
    }
    const base64Data = btoa(base64String);
    
    // First try with vision API for better PDF handling
    try {
      console.log("Intentando extraer con GPT-4o...");
      
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
              content: "Eres un asistente especializado en la extracción de información detallada de CVs. Tu objetivo es extraer toda la información relevante de un CV, incluyendo: datos personales, experiencia laboral (empresas, cargos, fechas y responsabilidades), educación, habilidades técnicas, idiomas, certificaciones y cualquier otra información relevante. Formatea la información de manera clara y estructurada."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "A continuación hay un CV en formato PDF. Extrae toda la información relevante para un análisis de reclutamiento."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${base64Data}`
                  }
                }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        })
      });
      
      if (!visionResponse.ok) {
        const errorData = await visionResponse.json();
        console.error("Error en extracción con Vision:", errorData);
        throw new Error("La extracción con GPT-4o falló, intentando método alternativo");
      }
      
      const visionResult = await visionResponse.json();
      const extractedText = visionResult.choices[0].message.content;
      
      console.log("Texto extraído con éxito usando GPT-4o, longitud:", extractedText.length);
      return extractedText;
    } catch (visionError) {
      console.error("Error en extracción con Vision, intentando método alternativo:", visionError);
      
      // Fallback to text-based extraction
      const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Tu tarea es extraer información de un documento PDF que contiene un CV. Intenta identificar y estructurar toda la información relevante."
            },
            {
              role: "user",
              content: "Este es un CV en formato PDF codificado en base64. Intenta extraer la información más relevante para un análisis de reclutamiento:\n\n" +
                base64Data.substring(0, 1000) + "..."
            }
          ],
          temperature: 0.5,
          max_tokens: 1500
        })
      });
      
      if (!textResponse.ok) {
        throw new Error("Ambos métodos de extracción fallaron");
      }
      
      const textResult = await textResponse.json();
      const fallbackText = textResult.choices[0].message.content;
      
      return "Extracción alternativa del CV:\n\n" + fallbackText;
    }
  } catch (error) {
    console.error("Error en extractTextFromPDFWithVision:", error);
    return "Error extrayendo texto del CV. Por favor, proporciona la información manualmente.";
  }
}
