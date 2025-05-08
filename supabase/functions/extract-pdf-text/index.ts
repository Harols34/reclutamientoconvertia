
// Importaciones para Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Variables de entorno
const OPENAI_API_KEY = Deno.env.get('OPENAI');
const MAX_FILE_SIZE_MB = parseInt(Deno.env.get('MAX_FILE_SIZE_MB') || '10');
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

// Servidor principal
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl } = await req.json();

    if (!pdfUrl) {
      return errorResponse('URL del PDF no proporcionada', 400);
    }

    if (!OPENAI_API_KEY) {
      return errorResponse('Clave API de OpenAI no configurada', 500);
    }

    // Log para depuración
    console.log(`Procesando PDF desde URL: ${pdfUrl}`);

    // Descargar PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error(`Error al descargar PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      return errorResponse(`No se pudo obtener el PDF: ${pdfResponse.status}`, 400);
    }

    const contentLength = parseInt(pdfResponse.headers.get('content-length') || '0');
    if (contentLength > MAX_FILE_SIZE) {
      console.error(`Archivo demasiado grande: ${contentLength} bytes (límite: ${MAX_FILE_SIZE} bytes)`);
      return errorResponse(`El archivo excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB`, 400);
    }

    // Convertir el PDF a base64 para enviarlo a la API de OpenAI
    const arrayBuffer = await pdfResponse.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binaryString);
    const dataUri = `data:application/pdf;base64,${base64Data}`;
    
    console.log(`PDF convertido a base64, tamaño: ${base64Data.length} caracteres`);

    // Extraer texto usando GPT-4o
    console.log('Enviando PDF a la API de OpenAI para extracción de texto...');
    const extractedText = await extractTextWithOpenAI(dataUri);

    if (!extractedText || extractedText.length < 50) {
      console.error('Texto extraído insuficiente o vacío');
      return errorResponse('No se pudo extraer texto suficiente del PDF', 400);
    }

    console.log(`Texto extraído exitosamente, longitud: ${extractedText.length} caracteres`);

    // Enviar a GPT para análisis estructurado
    console.log('Enviando texto extraído para análisis estructurado...');
    const analysis = await analyzeWithGPT(extractedText);
    console.log('Análisis estructurado completado');

    return new Response(JSON.stringify({
      success: true,
      text: extractedText,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error(`Error general en la función: ${err.message}`, err);
    return errorResponse(`Error: ${err.message}`, 500);
  }
});

// Función auxiliar para errores
function errorResponse(message: string, status = 400): Response {
  console.error(`Error: ${message} (${status})`);
  return new Response(JSON.stringify({ success: false, error: message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status
  });
}

// Nueva función para extraer texto del PDF usando OpenAI
async function extractTextWithOpenAI(pdfDataUri: string): Promise<string> {
  try {
    console.log('Iniciando extracción de texto con OpenAI');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Eres un sistema OCR avanzado especializado en extraer texto de currículums vitae.
            Tu única tarea es extraer TODO el texto visible en el PDF proporcionado.
            Extrae nombres, fechas, experiencia laboral, educación, habilidades, datos de contacto y cualquier otro texto visible.
            No añadas ningún comentario, análisis ni formato especial. Devuelve solo el texto extraído tal como aparece en el documento.`
          },
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: "Extrae todo el texto de este CV en formato PDF:"
              },
              {
                type: "image_url",
                image_url: {
                  url: pdfDataUri
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error en la API de OpenAI durante extracción:', error);
      throw new Error(`Error de OpenAI: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    console.log(`Texto extraído con OpenAI: ${extractedText.length} caracteres`);
    return extractedText;
  } catch (error) {
    console.error('Error extrayendo texto con OpenAI:', error);
    throw new Error(`Error al extraer texto con OpenAI: ${error.message}`);
  }
}

// Analiza el texto extraído con GPT-4o
async function analyzeWithGPT(text: string): Promise<string> {
  try {
    console.log('Iniciando análisis del texto extraído');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Eres un reclutador experto. Tu tarea es analizar el texto de un CV, identificar secciones clave y estructurarlas así:
- Datos personales
- Perfil profesional
- Experiencia laboral (empresa, cargo, fechas, responsabilidades)
- Educación
- Habilidades técnicas y blandas
- Certificaciones
- Idiomas
- Otra información relevante.

El contenido es texto plano extraído de un CV en PDF.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error en la API de OpenAI durante análisis:', error);
      throw new Error(`Error de OpenAI: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error analizando texto con OpenAI:', error);
    throw new Error(`Error al analizar el CV con OpenAI: ${error.message}`);
  }
}
