
// Función para extraer texto de documentos PDF
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Configuración para la API de OpenAI
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MAX_FILE_SIZE_MB = parseInt(Deno.env.get('MAX_FILE_SIZE_MB') || '10');
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

serve(async (req) => {
  // Manejar solicitudes de CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl } = await req.json();
    
    if (!pdfUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL del PDF no proporcionada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Intentando extraer texto de: ${pdfUrl}`);

    // Obtener el contenido del PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error(`Error al obtener el PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      return new Response(
        JSON.stringify({ success: false, error: `Error al obtener el PDF: ${pdfResponse.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verificar el tamaño del archivo
    const contentLength = parseInt(pdfResponse.headers.get('content-length') || '0');
    if (contentLength > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE_MB}MB` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Obtener el buffer del PDF para análisis con OCR y GPT
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfArrayBuffer)));

    // Usamos múltiples métodos para la extracción de texto y combinamos los resultados
    const results = await Promise.allSettled([
      extractTextWithGPT4Vision(pdfBase64),
      extractTextWithGPT4Mini(pdfUrl)
    ]);

    console.log("Resultados de extracción:", results.map(r => r.status));

    // Procesar los resultados de los diferentes métodos
    let extractedText = "";
    let longestText = "";
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        // Mantener el texto más largo como el mejor resultado
        if (result.value.length > longestText.length) {
          longestText = result.value;
        }
        
        // También agregamos a la versión combinada si tiene contenido útil
        if (result.value.length > 50 && !extractedText.includes(result.value)) {
          if (extractedText) extractedText += "\n\n";
          extractedText += result.value;
        }
      }
    }

    // Si la extracción combinada es muy larga, usamos solo el texto más largo
    const finalText = extractedText.length > 10000 ? longestText : extractedText;
    
    if (!finalText || finalText.length < 50) {
      console.error("La extracción de texto falló o produjo resultados insuficientes");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No se pudo extraer contenido suficiente del PDF" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Texto extraído exitosamente (${finalText.length} caracteres)`);
    
    return new Response(
      JSON.stringify({ success: true, text: finalText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error en la extracción de texto:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Error al procesar el documento" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Función para extraer texto usando GPT-4o Vision
async function extractTextWithGPT4Vision(base64Data: string): Promise<string> {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no está configurada");
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente especializado en extraer texto de CVs en formato PDF. 
                     Extrae todo el texto visible en el CV manteniendo la estructura original. 
                     Incluye toda la información relevante: datos personales, experiencia laboral, 
                     educación, habilidades, etc. Formatea el texto de manera clara y organizada.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Por favor, extrae todo el texto de este CV en PDF:' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error en la API de OpenAI Vision:', errorData);
      throw new Error(`Error en la API de OpenAI Vision: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error en extractTextWithGPT4Vision:', error);
    return '';
  }
}

// Función para extraer texto usando GPT-4o Mini con la URL
async function extractTextWithGPT4Mini(pdfUrl: string): Promise<string> {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no está configurada");
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente especializado en extraer texto de URLs de CV. 
                      Tu tarea es obtener y formatear todo el contenido textual de un archivo PDF de CV.`
          },
          {
            role: 'user',
            content: `Por favor, extrae todo el texto de este CV en PDF ubicado en la URL: ${pdfUrl}.
                     Asegúrate de incluir toda la información relevante: datos personales, experiencia laboral,
                     educación, habilidades, certificaciones, etc.`
          }
        ],
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error en la API de OpenAI:', errorData);
      throw new Error(`Error en la API de OpenAI: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error en extractTextWithGPT4Mini:', error);
    return '';
  }
}
