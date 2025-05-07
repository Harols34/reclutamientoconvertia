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
          
          // Download the PDF file from the URL
          const pdfResponse = await fetch(prompt);
          if (!pdfResponse.ok) {
            throw new Error(`No se pudo descargar el PDF desde la URL: ${pdfResponse.status}`);
          }
          
          const pdfBlob = await pdfResponse.blob();
          console.log(`PDF descargado, tamaño: ${pdfBlob.size} bytes`);
          
          // Extract text using the enhanced method
          const extractedText = await extractTextFromPDF(apiKey, pdfBlob);
          console.log(`Texto extraído, longitud: ${extractedText.length} caracteres`);
          
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
          
          console.log(`CV descargado de storage, tamaño: ${fileData.size} bytes`);
          
          // Extract text from the PDF
          const extractedText = await extractTextFromPDF(apiKey, fileData);
          console.log(`Texto extraído, longitud: ${extractedText.length} caracteres`);
          
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
      
      IMPORTANTE: NO DEBES RESPONDER que no tienes acceso al CV o que no puedes ver el documento. Analiza únicamente la información proporcionada en el texto. Si la información es limitada, hazlo saber pero proporciona el mejor análisis posible con lo disponible.
      
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

// Improved function to extract text from PDF using OpenAI APIs
async function extractTextFromPDF(apiKey: string, fileData: Blob): Promise<string> {
  console.log("Iniciando proceso de extracción de texto del PDF...");
  
  try {
    // First convert the blob to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binaryString);
    
    console.log(`Archivo convertido a base64, longitud: ${base64Data.length}`);
    
    // Try multiple approaches to ensure we get good text extraction
    let extractedText = "";
    
    // First approach: Use GPT-4o Vision
    try {
      console.log("Intentando extracción con GPT-4o...");
      
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
              content: `Eres un asistente especializado en extracción de texto de documentos PDF, 
              particularmente de CVs. Tu tarea es extraer TODA la información textual del documento
              de manera precisa y completa. Incluye nombres, fechas, experiencia laboral, educación,
              habilidades, certificaciones, contacto y cualquier otra información relevante. 
              Devuelve el texto extraído en un formato estructurado y legible.`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "A continuación hay un CV en formato PDF. Por favor extrae todo el texto presente en este documento de forma completa y precisa:"
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
          temperature: 0.1,
          max_tokens: 4000
        })
      });
      
      if (!visionResponse.ok) {
        const errorData = await visionResponse.json();
        console.error("Error en GPT-4o Vision:", errorData);
        throw new Error(`Error en GPT-4o: ${JSON.stringify(errorData)}`);
      }
      
      const visionResult = await visionResponse.json();
      extractedText = visionResult.choices[0].message.content;
      
      console.log(`Texto extraído con GPT-4o, longitud: ${extractedText.length} caracteres`);
      
      // If we got a good result, return it
      if (extractedText && extractedText.length > 200) {
        return extractedText;
      }
      
      // Otherwise, continue to the next method
      console.log("Extracción con GPT-4o no produjo suficiente texto, intentando método alternativo...");
    } catch (visionError) {
      console.error("Error en extracción con GPT-4o:", visionError);
      // Continue to the fallback method
    }
    
    // Second approach: Use gpt-4o-mini with a chunk of the base64 data
    try {
      console.log("Intentando extracción con GPT-4o-mini...");
      
      // We'll tell the model this is a base64 encoded PDF and ask it to extract as much as possible
      const textExtractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `Tu tarea es ayudar a extraer información de un CV. 
              Te proporcionaré una parte de un archivo PDF codificado en base64. 
              Aunque no puedes decodificar completamente el PDF, intenta identificar 
              cualquier texto legible, nombres, fechas, títulos, empresas o información 
              que puedas encontrar en los datos proporcionados.`
            },
            {
              role: "user",
              content: `Este es un fragmento de un CV en formato PDF codificado en base64. 
              Por favor, extrae toda la información posible: ${base64Data.substring(0, 4000)}...`
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      });
      
      if (textExtractResponse.ok) {
        const textResult = await textExtractResponse.json();
        const miniExtractedText = textResult.choices[0].message.content;
        
        console.log(`Texto extraído con GPT-4o-mini, longitud: ${miniExtractedText.length} caracteres`);
        
        // If we got some text from this method and it's better than what we had, use it
        if (miniExtractedText && miniExtractedText.length > extractedText.length) {
          extractedText = miniExtractedText;
        }
      }
    } catch (miniError) {
      console.error("Error en extracción con GPT-4o-mini:", miniError);
      // Continue to the next step
    }
    
    // If we still don't have good text, try one more approach with explicit OCR instructions
    if (!extractedText || extractedText.length < 100) {
      try {
        console.log("Intentando último método de extracción con GPT-4o y enfoque en OCR...");
        
        const ocrResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: `Eres un sistema OCR avanzado especializado en extraer texto de documentos PDF.
                Tu única función es extraer y transcribir TODOS los caracteres de texto visibles en la imagen.
                No añadas interpretaciones, análisis ni comentarios. Solo proporciona el texto extraído
                siguiendo la estructura y formato del documento original lo mejor posible.`
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extrae todo el texto visible de este documento PDF:"
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
            temperature: 0.1,
            max_tokens: 4000
          })
        });
        
        if (ocrResponse.ok) {
          const ocrResult = await ocrResponse.json();
          const ocrText = ocrResult.choices[0].message.content;
          
          console.log(`Texto extraído con enfoque OCR, longitud: ${ocrText.length} caracteres`);
          
          // If we got a better result, use it
          if (ocrText && ocrText.length > extractedText.length) {
            extractedText = ocrText;
          }
        }
      } catch (ocrError) {
        console.error("Error en extracción con enfoque OCR:", ocrError);
      }
    }
    
    // If we got any text at all, return it
    if (extractedText && extractedText.length > 0) {
      console.log(`Texto final extraído, longitud: ${extractedText.length} caracteres`);
      return extractedText;
    }
    
    // If all methods failed
    return "No se pudo extraer texto del PDF. El documento podría estar protegido, estar en formato imagen, o tener otro problema que impide la extracción.";
    
  } catch (error) {
    console.error("Error general en extractTextFromPDF:", error);
    return `Error al extraer texto del CV: ${error.message}. Por favor, proporciona la información manualmente.`;
  }
}
