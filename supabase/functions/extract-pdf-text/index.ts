
// Función para extraer texto de documentos PDF
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Configuración para la API de OpenAI
// Obtenemos directamente la clave de API de la variable de entorno OPENAI
const OPENAI_API_KEY = Deno.env.get('OPENAI');
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

    // Verificar si tenemos la clave API de OpenAI
    if (!OPENAI_API_KEY) {
      console.error("Error: API de OpenAI no configurada. Variables de entorno disponibles:", Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ success: false, error: 'Clave API de OpenAI no configurada en la variable OPENAI' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log("Clave API de OpenAI encontrada con longitud:", OPENAI_API_KEY.length);

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

    // Ya no convertimos a base64 para GPT-4 Vision ya que no acepta PDFs
    console.log("Usando solo GPT-4o Mini para la extracción");

    // Usar GPT-4o Mini con la URL para extraer el texto
    const extractedText = await extractTextWithGPT4Mini(pdfUrl);
    
    if (!extractedText || extractedText.length < 50) {
      console.error("La extracción de texto falló o produjo resultados insuficientes");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No se pudo extraer contenido suficiente del PDF" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Texto extraído exitosamente (${extractedText.length} caracteres)`);
    
    return new Response(
      JSON.stringify({ success: true, text: extractedText }),
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

// Función para extraer texto usando GPT-4o Mini con la URL
async function extractTextWithGPT4Mini(pdfUrl: string): Promise<string> {
  try {
    // Usar directamente la variable OPENAI_API_KEY del scope externo
    if (!OPENAI_API_KEY) {
      throw new Error("API de OpenAI no configurada");
    }

    console.log("Iniciando extracción con GPT-4o");

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
            content: `Eres un asistente especializado en extraer texto de PDFs de CV. 
                      Tu tarea es analizar el contenido de un PDF de CV y extraer 
                      toda la información relevante: datos personales, experiencia laboral,
                      educación, habilidades, certificaciones, etc. Hazlo de forma estructurada.`
          },
          {
            role: 'user',
            content: `Por favor, analiza y extrae todo el texto de este CV en PDF ubicado en la URL: ${pdfUrl}.
                     Asegúrate de incluir toda la información relevante estructurada por secciones.`
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
    console.log('Extracción con GPT-4o completada');
    return result.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error en extractTextWithGPT4Mini:', error);
    return '';
  }
}
