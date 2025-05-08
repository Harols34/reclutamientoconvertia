// Función Edge de Supabase para manejar la extracción de texto del PDF y pasar a OpenAI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  // Manejo de solicitudes CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "No se proporcionó base64 del PDF" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Clave de API de OpenAI no configurada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Solicitar OpenAI para procesar el PDF
    const extractedText = await extractTextWithGPT(pdfBase64);

    if (!extractedText || extractedText.length < 50) {
      return new Response(
        JSON.stringify({ success: false, error: "No se pudo extraer el contenido del PDF" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, text: extractedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en la función Edge:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Error al procesar el documento" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Función para interactuar con OpenAI y extraer el texto del PDF
async function extractTextWithGPT(pdfBase64: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Eres un asistente especializado en análisis de CVs. Extrae y organiza los datos de los CVs.",
          },
          {
            role: "user",
            content: `Extrae la información de este CV. Es un archivo PDF en base64. Aquí está el contenido base64: ${pdfBase64}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error("Error en la API de OpenAI");
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error en la función extractTextWithGPT:", error);
    throw error;
  }
}
