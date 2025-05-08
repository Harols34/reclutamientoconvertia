import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI');
const MAX_FILE_SIZE_MB = parseInt(Deno.env.get('MAX_FILE_SIZE_MB') || '10');
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl, jobDescription } = await req.json();

    if (!pdfUrl) {
      return new Response(JSON.stringify({ success: false, error: 'URL del PDF no proporcionada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Clave API de OpenAI no configurada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `Error al obtener el PDF: ${pdfResponse.status}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const contentLength = parseInt(pdfResponse.headers.get('content-length') || '0');
    if (contentLength > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({
        success: false,
        error: `El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE_MB}MB`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Extraer texto del CV con GPT-4o
    const extractedText = await extractCVText(pdfUrl);

    if (!extractedText || extractedText.length < 100) {
      return new Response(JSON.stringify({ success: false, error: 'El CV no tiene contenido suficiente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Si hay descripción de trabajo, hacemos el análisis de afinidad
    if (jobDescription && jobDescription.length > 20) {
      const matchAnalysis = await analyzeJobMatch(extractedText, jobDescription);
      return new Response(JSON.stringify({
        success: true,
        text: extractedText,
        match: matchAnalysis
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Solo extraer texto
    return new Response(JSON.stringify({
      success: true,
      text: extractedText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error general:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error inesperado'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function extractCVText(pdfUrl: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.1,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: `Eres un extractor de información de CVs en PDF. Tu objetivo es estructurar el contenido del documento en las siguientes secciones:
          - Datos personales (nombre, correo, teléfono, ubicación, redes sociales)
          - Resumen profesional
          - Experiencia laboral (cargo, empresa, fechas, funciones)
          - Educación
          - Habilidades técnicas y blandas
          - Certificaciones
          - Idiomas
          - Otros datos relevantes.`
        },
        {
          role: 'user',
          content: `Extrae todo el contenido del siguiente CV ubicado en esta URL: ${pdfUrl}`
        }
      ]
    })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error?.message || 'Error al extraer texto del CV');
  }

  return result.choices[0]?.message?.content || '';
}

async function analyzeJobMatch(cvText: string, jobDescription: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `Eres un experto en recursos humanos. Tu tarea es evaluar la compatibilidad entre un CV y una oferta laboral.`
        },
        {
          role: 'user',
          content: `Aquí tienes el texto del CV:\n\n${cvText}\n\nY esta es la descripción de la vacante:\n\n${jobDescription}\n\n
          Evalúa lo siguiente:
          1. Puntaje de afinidad (0 a 100)
          2. Fortalezas del candidato frente a la vacante
          3. Áreas de mejora o posibles brechas
          4. Justificación breve del puntaje.`
        }
      ]
    })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error?.message || 'Error al analizar afinidad con la vacante');
  }

  return result.choices[0]?.message?.content || '';
}
