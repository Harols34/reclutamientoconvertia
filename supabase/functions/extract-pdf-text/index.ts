import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib@^1.16.0";
import * as pdfjsLib from "https://cdn.skypack.dev/pdfjs-dist@^2.10.377";
import { readAll } from "https://deno.land/std@0.168.0/streams/read_all.ts";
import mammoth from "https://esm.sh/mammoth@1.4.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.10.377/build/pdf.worker.min.js";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl, fileType = 'pdf' } = await req.json();
    
    if (!pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'URL del documento es requerida' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Iniciando extracción de texto del documento:', pdfUrl);
    
    // Get the OpenAI API key from environment variables
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    const maxFileSize = parseInt(Deno.env.get('MAX_FILE_SIZE_MB') || '10') * 1024 * 1024;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Download the file first
    const fileResponse = await fetch(pdfUrl);
    if (!fileResponse.ok) {
      throw new Error(`Error descargando documento: ${fileResponse.status}`);
    }

    // Check file size
    const contentLength = parseInt(fileResponse.headers.get('content-length') || '0');
    if (contentLength > maxFileSize) {
      throw new Error(`El archivo excede el tamaño máximo permitido de ${maxFileSize / (1024 * 1024)}MB`);
    }

    const fileBlob = await fileResponse.blob();
    console.log(`Documento descargado, tamaño: ${fileBlob.size} bytes, tipo: ${fileType}`);

    // Extract text based on file type
    let extractedText = '';
    let pages = 1;
    let methodUsed = '';

    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          // Try multiple PDF extraction methods
          const pdfResults = await Promise.allSettled([
            extractWithPDFLib(fileBlob),
            extractWithPDFJS(fileBlob),
            extractWithGPT4Vision(apiKey, fileBlob)
          ]);

          // Log results of each method
          console.log("Resultados de extracción PDF:");
          pdfResults.forEach((result, index) => {
            const methods = ["PDF-lib", "PDF.js", "GPT-4 Vision"];
            if (result.status === "fulfilled") {
              console.log(`- ${methods[index]}: Éxito (${result.value.text.length} caracteres)`);
            } else {
              console.log(`- ${methods[index]}: Error (${result.reason})`);
            }
          });

          // Get the best result
          const successfulExtractions = pdfResults
            .filter((r): r is PromiseFulfilledResult<{text: string, pages?: number}> => 
              r.status === "fulfilled" && r.value.text.length > 50);

          if (successfulExtractions.length > 0) {
            // Sort by length and take the longest
            successfulExtractions.sort((a, b) => b.value.text.length - a.value.text.length);
            extractedText = successfulExtractions[0].value.text;
            pages = successfulExtractions[0].value.pages || 1;
            methodUsed = successfulExtractions[0].value.method || 'PDF-lib';
          } else {
            throw new Error("Todos los métodos de extracción PDF fallaron");
          }
          break;

        case 'docx':
        case 'doc':
          const arrayBuffer = await fileBlob.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value;
          methodUsed = 'Mammoth';
          break;

        case 'txt':
          extractedText = await fileBlob.text();
          methodUsed = 'Direct text';
          break;

        case 'jpg':
        case 'png':
        case 'image':
          extractedText = await extractWithOCR(apiKey, fileBlob);
          methodUsed = 'OCR';
          break;

        default:
          throw new Error(`Tipo de archivo no soportado: ${fileType}`);
      }

      if (!extractedText || extractedText.trim().length < 20) {
        throw new Error("El texto extraído es demasiado corto o vacío");
      }

      console.log(`Extracción exitosa usando ${methodUsed}. Texto: ${extractedText.substring(0, 100)}...`);

      return new Response(
        JSON.stringify({ 
          text: extractedText, 
          success: true,
          metadata: {
            method: methodUsed,
            length: extractedText.length,
            pages,
            fileType
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (extractionError) {
      console.error('Error en extracción principal:', extractionError);
      // Fallback to GPT-4 Vision if other methods fail
      console.log('Intentando extracción con GPT-4 Vision como fallback...');
      
      try {
        const visionResult = await extractWithGPT4Vision(apiKey, fileBlob);
        extractedText = visionResult.text;
        methodUsed = 'GPT-4 Vision (fallback)';

        return new Response(
          JSON.stringify({ 
            text: extractedText, 
            success: true,
            metadata: {
              method: methodUsed,
              length: extractedText.length,
              pages: 1,
              fileType,
              warning: "Used fallback method"
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fallbackError) {
        console.error('Fallback también falló:', fallbackError);
        throw new Error(`Extracción fallida: ${extractionError.message}. Fallback también falló: ${fallbackError.message}`);
      }
    }

  } catch (error) {
    console.error('Error procesando solicitud:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Error en el servidor', 
        details: error.message,
        stack: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// PDF extraction using pdf-lib
async function extractWithPDFLib(fileBlob: Blob): Promise<{text: string, pages: number, method: string}> {
  try {
    console.log("Intentando extracción con PDF-lib...");
    const arrayBuffer = await fileBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(new Uint8Array(arrayBuffer));
    const pages = pdfDoc.getPageCount();
    let fullText = '';

    for (let i = 0; i < pages; i++) {
      const page = pdfDoc.getPage(i);
      const text = await page.getText();
      fullText += text + '\n\n';
    }

    return {
      text: fullText.trim(),
      pages,
      method: 'PDF-lib'
    };
  } catch (error) {
    console.error("PDF-lib extraction error:", error);
    throw error;
  }
}

// PDF extraction using PDF.js
async function extractWithPDFJS(fileBlob: Blob): Promise<{text: string, pages: number, method: string}> {
  try {
    console.log("Intentando extracción con PDF.js...");
    const arrayBuffer = await fileBlob.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
    const pdfDocument = await loadingTask.promise;
    const pages = pdfDocument.numPages;
    let fullText = '';

    for (let i = 1; i <= pages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return {
      text: fullText.trim(),
      pages,
      method: 'PDF.js'
    };
  } catch (error) {
    console.error("PDF.js extraction error:", error);
    throw error;
  }
}

// OCR extraction using GPT-4 Vision
async function extractWithGPT4Vision(apiKey: string, fileBlob: Blob): Promise<{text: string, pages: number, method: string}> {
  try {
    console.log("Intentando extracción con GPT-4 Vision...");
    
    // Convert to base64 for API
    const arrayBuffer = await fileBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binaryString);
    const mimeType = fileBlob.type || 'application/pdf';

    // Use GPT-4 Vision to extract text
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `Eres un sistema avanzado de extracción de texto. Tu tarea es extraer TODO el texto del documento proporcionado, 
            manteniendo la estructura original. No interpretes, analices o resumas el contenido, solo extrae el texto tal como aparece. 
            Conserva saltos de línea, viñetas, tablas y formato básico.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extrae todo el texto de este documento, manteniendo el formato original:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 4096
      })
    });
    
    if (!visionResponse.ok) {
      const errorData = await visionResponse.json();
      console.error("Error en GPT-4 Vision:", errorData);
      throw new Error(`Error en GPT-4 Vision: ${JSON.stringify(errorData)}`);
    }
    
    const visionResult = await visionResponse.json();
    const extractedText = visionResult.choices[0].message.content;
    
    console.log(`Texto extraído con GPT-4 Vision: ${extractedText.substring(0, 100)}...`);
    return {
      text: extractedText,
      pages: 1, // GPT-4 Vision doesn't provide page count
      method: 'GPT-4 Vision'
    };
  } catch (error) {
    console.error("Error en extractWithGPT4Vision:", error);
    throw error;
  }
}

// Basic OCR function (in a real implementation, use a dedicated OCR service)
async function extractWithOCR(apiKey: string, fileBlob: Blob): Promise<string> {
  try {
    console.log("Intentando extracción con OCR...");
    
    // Convert to base64
    const arrayBuffer = await fileBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binaryString);
    const mimeType = fileBlob.type || 'image/jpeg';

    // Use GPT-4 Vision as OCR
    const ocrResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "Actúa como un sistema OCR avanzado. Extrae TODO el texto de la imagen, manteniendo la estructura y formato original. No interpretes ni analices el contenido."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extrae todo el texto de esta imagen:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 4096
      })
    });
    
    if (!ocrResponse.ok) {
      const errorData = await ocrResponse.json();
      throw new Error(`OCR failed: ${JSON.stringify(errorData)}`);
    }
    
    const ocrResult = await ocrResponse.json();
    return ocrResult.choices[0].message.content;
  } catch (error) {
    console.error("Error en extractWithOCR:", error);
    throw error;
  }
}
