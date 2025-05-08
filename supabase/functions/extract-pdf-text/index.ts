
// Importaciones para Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Variables de entorno
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPENAI');

// Servidor principal
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedText } = await req.json();

    if (!extractedText) {
      return errorResponse('Texto extraído no proporcionado', 400);
    }

    if (!OPENAI_API_KEY) {
      return errorResponse('Clave API de OpenAI no configurada', 500);
    }

    console.log(`Recibido texto para análisis: ${extractedText.substring(0, 100)}...`);
    
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
