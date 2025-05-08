// Importaciones para Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import * as pdfjsLib from 'npm:pdfjs-dist';

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

    // Descargar PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      return errorResponse(`No se pudo obtener el PDF: ${pdfResponse.status}`, 400);
    }

    const contentLength = parseInt(pdfResponse.headers.get('content-length') || '0');
    if (contentLength > MAX_FILE_SIZE) {
      return errorResponse(`El archivo excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB`, 400);
    }

    const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());

    // Extraer texto del PDF
    const extractedText = await extractTextFromPdf(pdfBytes);
    if (!extractedText || extractedText.length < 50) {
      return errorResponse('No se pudo extraer texto suficiente del PDF', 400);
    }

    // Enviar a GPT para análisis estructurado
    const analysis = await analyzeWithGPT(extractedText);

    return new Response(JSON.stringify({
      success: true,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return errorResponse(`Error: ${err.message}`, 500);
  }
});

// Función auxiliar para errores
function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status
  });
}

// Extrae texto de un archivo PDF
async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str).join(' ');
    fullText += strings + '\n';
  }

  return fullText.trim();
}

// Analiza el texto extraído con GPT-4o
async function analyzeWithGPT(text: string): Promise<string> {
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

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Error al analizar el CV con OpenAI');
  }

  return data.choices[0].message.content;
}
