
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { pdfUrl } = await req.json();
    
    if (!pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'URL del PDF es requerida' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log('Iniciando extracción de texto del PDF:', pdfUrl);
    
    // Get the OpenAI API key from environment variables
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Extract text using our multi-method approach
    const extractedText = await extractTextFromPDF(apiKey, pdfUrl);
    
    return new Response(
      JSON.stringify({ text: extractedText, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error procesando solicitud:', error);
    
    return new Response(
      JSON.stringify({ error: 'Error en el servidor', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Comprehensive text extraction function
async function extractTextFromPDF(apiKey: string, pdfUrl: string): Promise<string> {
  console.log("Iniciando proceso de extracción de texto del PDF...");
  
  // Try to extract text using multiple methods and combine the results
  const extractionResults = await Promise.allSettled([
    extractWithGPT4Vision(apiKey, pdfUrl),
    extractWithGPT4Mini(apiKey, pdfUrl),
    extractWithOCR(apiKey, pdfUrl),
  ]);
  
  // Log the results of each method
  console.log("Resultados de extracción:");
  extractionResults.forEach((result, index) => {
    const method = ["GPT-4o Vision", "GPT-4o Mini", "OCR"][index];
    if (result.status === "fulfilled") {
      console.log(`- ${method}: Éxito (${result.value.length} caracteres)`);
    } else {
      console.log(`- ${method}: Error (${result.reason})`);
    }
  });
  
  // Collect successful extraction results
  const successfulTexts = extractionResults
    .filter((result): result is PromiseFulfilledResult<string> => 
      result.status === "fulfilled" && result.value.length > 100)
    .map(result => result.value);
  
  // If we have at least one successful extraction, use the longest one
  if (successfulTexts.length > 0) {
    // Sort by length (descending) and take the longest
    const longestText = successfulTexts.sort((a, b) => b.length - a.length)[0];
    console.log(`Texto final extraído con éxito (${longestText.length} caracteres)`);
    return longestText;
  }
  
  throw new Error("No se pudo extraer texto del PDF utilizando ninguno de los métodos disponibles");
}

// Method 1: Extract text using GPT-4o Vision
async function extractWithGPT4Vision(apiKey: string, pdfUrl: string): Promise<string> {
  try {
    console.log("Intentando extracción con GPT-4o Vision...");
    
    // Download PDF file first
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Error descargando PDF: ${pdfResponse.status}`);
    }
    
    const pdfBlob = await pdfResponse.blob();
    console.log(`PDF descargado, tamaño: ${pdfBlob.size} bytes`);
    
    // Convert to base64 for API
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binaryString);
    
    // Use GPT-4o Vision to extract text from the PDF
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
            content: `Eres un sistema OCR avanzado especializado en extraer texto de documentos PDF.
            Tu tarea es extraer TODA la información textual del documento, especialmente si es un CV.
            Incluye nombres, fechas, experiencia laboral, educación, habilidades, certificaciones,
            y cualquier otra información relevante. Devuelve el texto extraído en formato plano y estructurado.
            NO AÑADAS INTERPRETACIONES, solo extrae lo que ves en el documento.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extrae todo el texto visible de este CV en formato PDF:"
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
        max_tokens: 4000
      })
    });
    
    if (!visionResponse.ok) {
      const errorData = await visionResponse.json();
      console.error("Error en GPT-4o Vision:", errorData);
      throw new Error(`Error en GPT-4o Vision: ${JSON.stringify(errorData)}`);
    }
    
    const visionResult = await visionResponse.json();
    const extractedText = visionResult.choices[0].message.content;
    
    console.log(`Texto extraído con GPT-4o Vision: ${extractedText.substring(0, 100)}...`);
    return extractedText;
  } catch (error) {
    console.error("Error en extractWithGPT4Vision:", error);
    throw error;
  }
}

// Method 2: Extract text using GPT-4o Mini with file URL
async function extractWithGPT4Mini(apiKey: string, pdfUrl: string): Promise<string> {
  try {
    console.log("Intentando extracción con GPT-4o Mini...");
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Tu tarea es analizar la URL de un PDF de un CV y extraer la mayor cantidad
            de información posible. El PDF contiene un currículum vitae. Por favor extrae toda la
            información importante como nombre, experiencia laboral, educación, habilidades, etc.
            Solo proporciona el texto extraído, sin comentarios adicionales.`
          },
          {
            role: "user",
            content: `Extrae el texto de este PDF de CV: ${pdfUrl}`
          }
        ],
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error en GPT-4o Mini:", errorData);
      throw new Error(`Error en GPT-4o Mini: ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    const extractedText = result.choices[0].message.content;
    
    console.log(`Texto extraído con GPT-4o Mini: ${extractedText.substring(0, 100)}...`);
    return extractedText;
  } catch (error) {
    console.error("Error en extractWithGPT4Mini:", error);
    throw error;
  }
}

// Method 3: Extract using OCR approach
async function extractWithOCR(apiKey: string, pdfUrl: string): Promise<string> {
  try {
    console.log("Intentando extracción con enfoque OCR...");
    
    // Download PDF file first
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Error descargando PDF: ${pdfResponse.status}`);
    }
    
    const pdfBlob = await pdfResponse.blob();
    console.log(`PDF descargado para OCR, tamaño: ${pdfBlob.size} bytes`);
    
    // Convert to base64 for API
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binaryString);
    
    // Try with a different prompt approach specifically for OCR
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
            content: `Ignora todo el formato visual y únicamente enfócate en extraer el texto 
            del documento como si fueras un OCR avanzado. No añadas ninguna interpretación o
            comentario. Solo proporciona el texto extraído línea por línea.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Conviértete en un sistema OCR y extrae únicamente el texto de este documento:"
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
        max_tokens: 4000
      })
    });
    
    if (!ocrResponse.ok) {
      const errorData = await ocrResponse.json();
      console.error("Error en enfoque OCR:", errorData);
      throw new Error(`Error en enfoque OCR: ${JSON.stringify(errorData)}`);
    }
    
    const ocrResult = await ocrResponse.json();
    const extractedText = ocrResult.choices[0].message.content;
    
    console.log(`Texto extraído con enfoque OCR: ${extractedText.substring(0, 100)}...`);
    return extractedText;
  } catch (error) {
    console.error("Error en extractWithOCR:", error);
    throw error;
  }
}
