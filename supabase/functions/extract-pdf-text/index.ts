
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Iniciando función extract-pdf-text');
    
    // Parse the request body
    const requestBody = await req.json();
    const { extractedText, jobDetails } = requestBody;
    
    if (!extractedText) {
      console.error('No text provided for analysis');
      throw new Error('No se proporcionó texto para análisis');
    }
    
    console.log('Recibido texto para análisis:', extractedText.substring(0, 100) + '...');
    console.log('Enviando texto extraído para análisis estructurado...');
    
    // OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('Clave de API de OpenAI no configurada');
    }
    
    // Prepare system prompt based on whether job details are provided
    let systemPrompt = `Analiza el siguiente texto extraído de un currículum vitae y devuelve un análisis detallado en formato JSON.
    
    Tu respuesta debe ser un objeto JSON con la siguiente estructura:
    {
      "datosPersonales": {
        "nombre": "",
        "telefono": "",
        "email": "",
        "ubicacion": "",
        "disponibilidad": "",
        "linkedin": ""
      },
      "perfilProfesional": "",
      "experienciaLaboral": [
        {
          "empresa": "",
          "cargo": "",
          "fechas": "",
          "responsabilidades": [""]
        }
      ],
      "educacion": [
        {
          "institucion": "",
          "carrera": "",
          "fechas": ""
        }
      ],
      "habilidades": [""],
      "certificaciones": [""],
      "idiomas": [""],
      "fortalezas": [""],
      "areasAMejorar": [""]`;
    
    // If job details provided, add compatibility analysis
    if (jobDetails) {
      systemPrompt += `,
      "compatibilidad": {
        "porcentaje": 0,
        "fortalezas": [""],
        "debilidades": [""],
        "recomendacion": ""
      }
      
      Para la sección "compatibilidad", evalúa qué tan bien se ajusta el candidato a la vacante proporcionada:
      - Asigna un porcentaje entre 0 y 100 basado en cómo las habilidades, experiencia y conocimientos del candidato coinciden con los requisitos de la vacante
      - Identifica las fortalezas clave del candidato para esta posición
      - Identifica áreas donde el candidato podría no cumplir con los requisitos
      - Proporciona una recomendación profesional sobre si seguir con este candidato
      
      Detalles de la vacante:
      Título: ${jobDetails?.title || 'No proporcionado'}
      Descripción: ${jobDetails?.description || 'No proporcionada'}
      Requisitos: ${jobDetails?.requirements || 'No proporcionados'}
      Responsabilidades: ${jobDetails?.responsibilities || 'No proporcionadas'}`;
    }
    
    // Close JSON structure 
    systemPrompt += `
    }
    
    IMPORTANTE: Asegúrate de que tu respuesta sea un objeto JSON válido y bien formateado. No incluyas markdown, comentarios ni información adicional fuera del objeto JSON.`;
    
    console.log('Iniciando análisis del texto extraído con OpenAI');
    
    try {
      // Analyze CV with OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Aquí está el texto extraído del CV para analizar: ${extractedText}` }
          ],
          temperature: 0.5,
          max_tokens: 2000
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from OpenAI:', errorData);
        throw new Error(`Error en la API de OpenAI: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid response format from OpenAI:', data);
        throw new Error('Respuesta inválida de OpenAI');
      }
      
      const analysisResult = data.choices[0].message.content;
      
      // Validate that the result is valid JSON
      try {
        const parsed = JSON.parse(analysisResult);
        console.log('Análisis estructurado completado correctamente');
        console.log('Resultado: ', JSON.stringify(parsed).substring(0, 200) + '...');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            analysis: analysisResult 
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      } catch (e) {
        console.error('Error: El resultado no es un JSON válido:', e);
        console.error('Resultado que causó error:', analysisResult);
        throw new Error('El análisis no devolvió un formato JSON válido');
      }
    } catch (openAiError) {
      console.error('Error al comunicarse con OpenAI:', openAiError);
      throw new Error(`Error al comunicarse con OpenAI: ${openAiError.message}`);
    }
    
  } catch (error) {
    console.error('Error en extract-pdf-text function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error procesando el documento' 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
