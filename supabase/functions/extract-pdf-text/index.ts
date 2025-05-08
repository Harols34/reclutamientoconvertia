
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
    const { extractedText, jobDetails } = await req.json();

    if (!extractedText) {
      return errorResponse('Texto extraído no proporcionado', 400);
    }

    if (!OPENAI_API_KEY) {
      return errorResponse('Clave API de OpenAI no configurada', 500);
    }

    console.log(`Recibido texto para análisis: ${extractedText.substring(0, 100)}...`);
    
    // Enviar a GPT para análisis estructurado
    console.log('Enviando texto extraído para análisis estructurado...');
    const analysis = await analyzeWithGPT(extractedText, jobDetails);
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
async function analyzeWithGPT(text: string, jobDetails?: any): Promise<any> {
  try {
    console.log('Iniciando análisis del texto extraído');
    
    // Construir el sistema prompt con información de la vacante si está disponible
    let systemPrompt = `Eres un reclutador experto. Tu tarea es analizar el texto de un CV y proporcionar un análisis estructurado.`;
    
    if (jobDetails) {
      systemPrompt += `\n\nDebes también evaluar la compatibilidad del candidato con la siguiente vacante:
Título: ${jobDetails.title || 'No especificado'}
Requisitos: ${jobDetails.requirements || 'No especificados'}
Responsabilidades: ${jobDetails.responsibilities || 'No especificadas'}
Descripción: ${jobDetails.description || 'No especificada'}

Calcula un porcentaje de compatibilidad (0-100) basado en cómo las habilidades, experiencia y educación del candidato se alinean con los requisitos de la vacante.`;
    }
    
    systemPrompt += `\n\nTu respuesta debe estar en formato JSON con la siguiente estructura:
{
  "datosPersonales": {
    "nombre": "string",
    "telefono": "string",
    "email": "string",
    "ubicacion": "string",
    "disponibilidad": "string",
    "linkedin": "string"
  },
  "perfilProfesional": "string",
  "experienciaLaboral": [
    {
      "empresa": "string",
      "cargo": "string",
      "fechas": "string",
      "responsabilidades": ["string"]
    }
  ],
  "educacion": [
    {
      "institucion": "string",
      "carrera": "string",
      "fechas": "string"
    }
  ],
  "habilidades": ["string"],
  "certificaciones": ["string"],
  "idiomas": ["string"],
  "fortalezas": ["string"],
  "areasAMejorar": ["string"],
  "compatibilidad": {
    "porcentaje": number,
    "fortalezas": ["string"],
    "debilidades": ["string"],
    "recomendacion": "string"
  }
}

El contenido es texto plano extraído de un CV en PDF.`;
    
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        response_format: { type: "json_object" },
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
