
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { prompt, type, context } = await req.json();
    
    let systemPrompt = "You are a helpful assistant for a recruitment platform.";
    
    if (type === 'chatbot') {
      systemPrompt = "You are an AI recruitment assistant for CONVERT-IA RECLUTAMIENTO. " +
        "Answer questions about job positions, application process, and recruitment in general. " +
        "Be concise, professional and helpful. " + 
        (context ? `Additional context: ${context}` : "");
    } else if (type === 'cv-analysis') {
      systemPrompt = "You are a CV analysis expert. Analyze the provided resume information " +
        "and provide insights about the candidate's skills, experience, and suitability for the job. " +
        "Structure your response with bullet points for key skills and qualifications. " +
        (context ? `Job requirements: ${context}` : "");
    }
    
    console.log("Calling OpenAI with prompt:", prompt.substring(0, 50) + "...");
    console.log("System prompt:", systemPrompt);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in OpenAI function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
