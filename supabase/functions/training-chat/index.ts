
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

    // Inicializar el cliente de Supabase con la clave de servicio
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, sessionId, message, trainingCode, candidateName } = await req.json();

    // Verificar acción solicitada
    if (action === 'start-session') {
      return await handleStartSession(supabase, trainingCode, candidateName, corsHeaders);
    } else if (action === 'send-message') {
      return await handleChatMessage(supabase, openaiApiKey, sessionId, message, corsHeaders);
    } else if (action === 'end-session') {
      return await handleEndSession(supabase, openaiApiKey, sessionId, corsHeaders);
    } else {
      throw new Error('Acción no válida');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Función para iniciar una nueva sesión de entrenamiento
async function handleStartSession(supabase, trainingCode, candidateName, corsHeaders) {
  // Verificar que el código de entrenamiento exista y sea válido
  const { data: codeData, error: codeError } = await supabase
    .from('training_codes')
    .select('id, is_used, expires_at')
    .eq('code', trainingCode)
    .single();

  if (codeError || !codeData) {
    return new Response(
      JSON.stringify({ error: 'Código de entrenamiento no válido' }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // Verificar que el código no haya sido usado
  if (codeData.is_used) {
    return new Response(
      JSON.stringify({ error: 'Este código ya ha sido utilizado' }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // Verificar que el código no haya expirado
  const now = new Date();
  const expiresAt = new Date(codeData.expires_at);
  
  if (now > expiresAt) {
    return new Response(
      JSON.stringify({ error: 'Este código ha expirado' }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // Crear nueva sesión de entrenamiento
  const { data: sessionData, error: sessionError } = await supabase
    .from('training_sessions')
    .insert({
      training_code_id: codeData.id,
      candidate_name: candidateName,
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (sessionError) {
    console.error('Error al crear sesión:', sessionError);
    return new Response(
      JSON.stringify({ error: 'No se pudo crear la sesión de entrenamiento' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // Marcar el código como usado
  await supabase
    .from('training_codes')
    .update({ is_used: true })
    .eq('id', codeData.id);

  // Enviar mensaje inicial de bienvenida como IA
  const welcomeMessage = "¡Hola! Soy un cliente interesado en los servicios de CONVERT-IA. ¿Podrías ayudarme a entender qué ofrecen y cómo pueden ayudarme?";
  
  await supabase
    .from('training_messages')
    .insert({
      session_id: sessionData.id,
      sender_type: 'ai',
      content: welcomeMessage,
    });

  return new Response(
    JSON.stringify({ 
      success: true, 
      session: sessionData,
      welcomeMessage
    }),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    }
  );
}

// Función para manejar los mensajes del chat
async function handleChatMessage(supabase, openaiApiKey, sessionId, message, corsHeaders) {
  // Guardar mensaje del candidato
  const { error: messageError } = await supabase
    .from('training_messages')
    .insert({
      session_id: sessionId,
      sender_type: 'candidate',
      content: message,
    });

  if (messageError) {
    console.error('Error al guardar mensaje:', messageError);
    return new Response(
      JSON.stringify({ error: 'Error al guardar el mensaje' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // Obtener historial de mensajes para contexto
  const { data: historyData } = await supabase
    .from('training_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('sent_at', { ascending: true });

  // Preparar mensajes para OpenAI
  const messages = [
    {
      role: "system",
      content: `Eres un cliente potencial de una empresa de tecnología llamada CONVERT-IA que se especializa en servicios de reclutamiento y soluciones de IA. 
      Estás hablando con un representante de ventas. Tu objetivo es simular una conversación natural para evaluar sus habilidades de atención al cliente.
      
      Características del cliente (tú):
      - Tienes un nivel medio de interés en los servicios
      - Quieres saber cómo la IA puede ayudar en el proceso de reclutamiento
      - Estás preocupado por los costos y el tiempo de implementación
      - Te preocupa la privacidad de los datos
      
      Comportamiento:
      - Haz preguntas específicas sobre los servicios
      - Pide ejemplos de cómo han ayudado a otras empresas
      - Menciona algunas objeciones sobre el precio o la complejidad
      - Sé cortés pero exigente con la información
      
      IMPORTANTE:
      - Mantén respuestas concisas (máximo 3 frases)
      - NO menciones que eres una IA o un evaluador
      - Actúa como un cliente real que tiene dudas genuinas
      - NO des feedback sobre el desempeño del candidato
      - La conversación es para evaluar al representante, pero no lo menciones`
    }
  ];

  // Añadir historial de mensajes
  historyData.forEach(msg => {
    const role = msg.sender_type === 'ai' ? 'assistant' : 'user';
    messages.push({
      role: role,
      content: msg.content
    });
  });

  try {
    // Llamar a OpenAI para generar respuesta
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Respuesta de OpenAI inválida');
    }

    const aiResponse = data.choices[0].message.content;

    // Guardar respuesta de la IA
    await supabase
      .from('training_messages')
      .insert({
        session_id: sessionId,
        sender_type: 'ai',
        content: aiResponse,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: aiResponse 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error con OpenAI:', error);
    return new Response(
      JSON.stringify({ error: 'Error al generar respuesta' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}

// Función para finalizar la sesión y generar evaluación
async function handleEndSession(supabase, openaiApiKey, sessionId, corsHeaders) {
  try {
    // Marcar tiempo de finalización
    const { data: sessionData, error: updateError } = await supabase
      .from('training_sessions')
      .update({
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      throw new Error('Error al actualizar la sesión');
    }

    // Obtener todos los mensajes de la sesión
    const { data: messagesData, error: messagesError } = await supabase
      .from('training_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('sent_at', { ascending: true });

    if (messagesError) {
      throw new Error('Error al obtener mensajes');
    }

    // Preparar mensajes para la evaluación con OpenAI
    const messagesForEvaluation = messagesData.map(msg => ({
      role: msg.sender_type === 'ai' ? 'assistant' : 'user',
      content: msg.content,
      timestamp: msg.sent_at
    }));

    // Calcular tiempos de respuesta promedio
    const candidateMessages = messagesData.filter(msg => msg.sender_type === 'candidate');
    let totalResponseTime = 0;
    let averageResponseTime = 0;
    
    if (candidateMessages.length > 1) {
      for (let i = 1; i < candidateMessages.length; i++) {
        const prevMessageTime = new Date(messagesData.find(msg => 
          msg.sender_type === 'ai' && 
          new Date(msg.sent_at) < new Date(candidateMessages[i].sent_at) && 
          new Date(msg.sent_at) > new Date(candidateMessages[i-1].sent_at)
        )?.sent_at || candidateMessages[i-1].sent_at);
        
        const currentMessageTime = new Date(candidateMessages[i].sent_at);
        totalResponseTime += (currentMessageTime.getTime() - prevMessageTime.getTime()) / 1000; // en segundos
      }
      averageResponseTime = totalResponseTime / (candidateMessages.length - 1);
    }

    // Llamar a OpenAI para generar evaluación
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres un evaluador experto en ventas y atención al cliente. Vas a evaluar una conversación entre un cliente potencial (AI) y un representante de ventas (candidato) para la empresa CONVERT-IA.
            
            La empresa CONVERT-IA ofrece servicios de reclutamiento potenciados con inteligencia artificial.
            
            Evalúa la conversación en las siguientes categorías, donde cada categoría debe recibir una puntuación entre 0 y 10:
            1. Tiempo de respuesta: ${averageResponseTime.toFixed(1)} segundos en promedio
            2. Claridad y precisión en las respuestas
            3. Conocimiento del producto mostrado
            4. Manejo de objeciones del cliente
            5. Habilidad para generar interés y cerrar ventas
            
            Debes proporcionar:
            1. Una puntuación numérica global entre 0 y 100
            2. Un resumen de fortalezas (máximo 50 palabras)
            3. Áreas de mejora (máximo 50 palabras)
            4. Al menos 2 consejos específicos para mejorar
            
            Formato de respuesta:
            Puntuación global: [NÚMERO]
            
            Fortalezas:
            [TEXTO]
            
            Áreas de mejora:
            [TEXTO]
            
            Consejos específicos:
            - [CONSEJO 1]
            - [CONSEJO 2]`
          },
          {
            role: "user",
            content: `Aquí está la conversación para evaluar:\n\n${messagesForEvaluation.map(msg => 
              `${msg.role.toUpperCase()} (${new Date(msg.timestamp).toLocaleTimeString()}): ${msg.content}`
            ).join('\n\n')}`
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Respuesta de OpenAI inválida');
    }

    const evaluationText = data.choices[0].message.content;
    
    // Extraer puntuación de la evaluación
    const scoreMatch = evaluationText.match(/Puntuación global: (\d+)/);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

    // Actualizar la sesión con la puntuación y retroalimentación
    await supabase
      .from('training_sessions')
      .update({
        score: score,
        feedback: evaluationText,
      })
      .eq('id', sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        evaluation: {
          text: evaluationText,
          score: score,
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error al finalizar sesión:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
