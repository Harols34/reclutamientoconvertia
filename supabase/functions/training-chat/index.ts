
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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPENAI') || '';

    // Log environment status
    console.log('Environment check:', {
      supabaseUrlSet: !!supabaseUrl,
      serviceKeySet: !!supabaseServiceKey,
      openaiKeySet: !!openaiApiKey
    });

    // Verificar que las variables de entorno estén configuradas
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Faltan variables de entorno requeridas para Supabase');
    }

    if (!openaiApiKey) {
      console.error('Falta la clave API de OpenAI');
      throw new Error('Falta la clave API de OpenAI. Configura OPENAI_API_KEY o OPENAI en los secretos de funciones.');
    }

    // Inicializar el cliente de Supabase con la clave de servicio
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parsear el cuerpo de la solicitud
    let body;
    try {
      body = await req.json();
    } catch (error) {
      throw new Error('Error al parsear el cuerpo de la solicitud: ' + error.message);
    }

    const { action, sessionId, message, trainingCode, candidateName } = body;

    // Verificar que la acción sea válida
    if (!action) {
      throw new Error('No se especificó una acción');
    }

    console.log(`Ejecutando acción: ${action} con datos:`, JSON.stringify(body));

    // Verificar acción solicitada
    if (action === 'validate-code') {
      return await handleValidateCode(supabase, trainingCode, corsHeaders);
    } else if (action === 'start-session') {
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
      JSON.stringify({ success: false, error: error.message }),
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

// Nueva función para validar código sin crear sesión
async function handleValidateCode(supabase, trainingCode, corsHeaders) {
  if (!trainingCode) {
    return new Response(
      JSON.stringify({ error: 'Código de entrenamiento no proporcionado' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  try {
    console.log(`Validando código: "${trainingCode}"`);

    // Verificar que el código de entrenamiento exista y sea válido
    const { data: codeData, error: codeError } = await supabase
      .from('training_codes')
      .select('id, expires_at')
      .eq('code', trainingCode)
      .maybeSingle();

    console.log('Resultado de búsqueda de código:', codeData, codeError);

    if (codeError) {
      console.error('Error en la consulta:', codeError);
      return new Response(
        JSON.stringify({ error: 'Error al verificar código: ' + codeError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!codeData) {
      console.log(`Código no encontrado: "${trainingCode}"`);
      return new Response(
        JSON.stringify({ error: 'Código de entrenamiento no encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        code: {
          id: codeData.id,
          expiresAt: codeData.expires_at
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error en handleValidateCode:', error);
    return new Response(
      JSON.stringify({ error: 'Error al validar código: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Función para iniciar una nueva sesión de entrenamiento
async function handleStartSession(supabase, trainingCode, candidateName, corsHeaders) {
  // Verificar parámetros requeridos
  if (!trainingCode) {
    return new Response(
      JSON.stringify({ error: 'Código de entrenamiento no proporcionado' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  if (!candidateName) {
    return new Response(
      JSON.stringify({ error: 'Nombre de candidato no proporcionado' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  try {
    console.log(`Verificando código: "${trainingCode}"`);

    // Verificar que el código de entrenamiento exista y sea válido
    const { data: codeData, error: codeError } = await supabase
      .from('training_codes')
      .select('id, expires_at')
      .eq('code', trainingCode)
      .maybeSingle();

    console.log('Resultado de la consulta:', codeData, codeError);

    if (codeError) {
      console.error('Error al buscar código:', codeError);
      return new Response(
        JSON.stringify({ error: 'Error en base de datos: ' + codeError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!codeData) {
      return new Response(
        JSON.stringify({ error: 'Código de entrenamiento no encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Datos del código:', codeData);

    // Verificar que el código no haya expirado
    const now = new Date();
    const expiresAt = new Date(codeData.expires_at);
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Este código ha expirado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Creando nueva sesión de entrenamiento para:', candidateName);

    // Crear nueva sesión de entrenamiento
    const { data: sessionData, error: sessionError } = await supabase
      .from('training_sessions')
      .insert({
        training_code_id: codeData.id,
        candidate_name: candidateName.trim(),
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error al crear sesión:', sessionError);
      return new Response(
        JSON.stringify({ error: 'No se pudo crear la sesión de entrenamiento: ' + sessionError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Sesión creada:', sessionData);

    // A diferencia de antes, NO enviamos mensaje inicial
    // Esperamos que el candidato inicie la conversación

    return new Response(
      JSON.stringify({ 
        success: true, 
        session: sessionData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error en handleStartSession:', error);
    return new Response(
      JSON.stringify({ error: 'Error al iniciar la sesión: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Función para manejar los mensajes del chat
async function handleChatMessage(supabase, openaiApiKey, sessionId, message, corsHeaders) {
  // Verify parameters required
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'ID de sesión no proporcionado' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  if (!message) {
    return new Response(
      JSON.stringify({ error: 'Mensaje no proporcionado' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  try {
    console.log(`Procesando mensaje para sesión: ${sessionId}`);
    
    // Verify that the session exists
    const { data: sessionData, error: sessionError } = await supabase
      .from('training_sessions')
      .select('id, candidate_name')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('Error finding session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Error al verificar sesión: ' + sessionError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!sessionData) {
      return new Response(
        JSON.stringify({ error: 'Sesión no encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Save candidate's message
    const { data: userMessageData, error: messageError } = await supabase
      .from('training_messages')
      .insert({
        session_id: sessionId,
        sender_type: 'candidate',
        content: message,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving message:', messageError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar el mensaje: ' + messageError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Mensaje de candidato guardado:', userMessageData);

    // Get message history for context
    const { data: historyData, error: historyError } = await supabase
      .from('training_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('sent_at', { ascending: true });

    if (historyError) {
      console.error('Error getting message history:', historyError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener historial de mensajes: ' + historyError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Analyze message history to identify candidate name and products/services mentioned
    let candidateName = sessionData.candidate_name || "representante";
    let productsMentioned = [];
    let isFirstMessage = historyData.length <= 1; // Considering current message is already in history
    
    // Extract product/service mentions from candidate messages
    for (const msg of historyData) {
      if (msg.sender_type === 'candidate') {
        // Check for product/service mentions in candidate messages
        const lowerMsg = msg.content.toLowerCase();
        
        // Detect common product types
        if (lowerMsg.includes('plan') || lowerMsg.includes('móvil') || lowerMsg.includes('celular')) {
          productsMentioned.push('plan móvil');
        }
        if (lowerMsg.includes('internet') || lowerMsg.includes('fibra') || lowerMsg.includes('wifi')) {
          productsMentioned.push('internet');
        }
        if (lowerMsg.includes('tv') || lowerMsg.includes('televisión') || lowerMsg.includes('cable')) {
          productsMentioned.push('TV');
        }
        if (lowerMsg.includes('combo') || lowerMsg.includes('paquete')) {
          productsMentioned.push('combo');
        }
        if (lowerMsg.includes('hogar') || lowerMsg.includes('casa') || lowerMsg.includes('seguridad')) {
          productsMentioned.push('servicios para el hogar');
        }
        if (lowerMsg.includes('tecnología') || lowerMsg.includes('electrodoméstico') || lowerMsg.includes('dispositivo')) {
          productsMentioned.push('productos tecnológicos');
        }
      }
    }
    
    // Get unique product mentions
    productsMentioned = [...new Set(productsMentioned)];

    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system",
        content: `Eres un cliente potencial que está interesado en los servicios que ofrece CONVERT-IA, una empresa que ofrece diversos productos y servicios.
        
        El representante con el que hablas se llama ${candidateName}.
        
        Para esta conversación, actúa como un cliente real con estas características:
        - Eres una persona ocupada con poco tiempo
        - Tienes interés en lo que te ofrecen pero necesitas estar convencido
        - Haces preguntas sobre beneficios, precios y detalles
        - Planteas objeciones razonables para ver cómo responde el representante
        - Tu objetivo es evaluar las habilidades de atención al cliente del representante
        
        ${productsMentioned.length > 0 
          ? `El representante te ha mencionado: ${productsMentioned.join(', ')}. Centra la conversación en estos productos/servicios.` 
          : 'No hay productos específicos mencionados aún. En tu primera respuesta, pregunta qué servicios o productos pueden ofrecerte.'}
        
        ${isFirstMessage 
          ? 'Esta es la primera interacción del representante. Responde como un cliente que ha sido contactado, preguntando qué productos o servicios pueden ofrecerte.' 
          : 'Continúa la conversación de manera natural, haciendo preguntas o planteando objeciones sobre lo que te han ofrecido.'}
        
        Comportamiento:
        - Usa un tono conversacional y natural
        - Mantén respuestas concisas (máximo 3 frases)
        - Haz preguntas específicas sobre lo que te ofrecen
        - Muestra interés pero también escepticismo
        - Plantea al menos una objeción (precio, calidad, necesidad, etc.)
        
        IMPORTANTE:
        - Nunca menciones que eres una IA o un evaluador
        - No des feedback sobre el desempeño del candidato
        - Sólo actúas como cliente, no ofreces productos/servicios
        - No propongas cerrar la venta, eso debe hacerlo el representante
        
        Objetivo: Simular una conversación de venta realista donde el representante debe persuadirte.`
      }
    ];

    // Add message history
    historyData.forEach(msg => {
      const role = msg.sender_type === 'ai' ? 'assistant' : 'user';
      messages.push({
        role: role,
        content: msg.content
      });
    });

    console.log('Enviando mensajes a OpenAI:', JSON.stringify(messages, null, 2));

    try {
      // Call OpenAI to generate response
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

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI error:', response.status, errorData);
        throw new Error(`OpenAI error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      console.log('OpenAI response:', JSON.stringify(data, null, 2));
      
      if (!data.choices || !data.choices[0]) {
        console.error('Invalid OpenAI response:', data);
        throw new Error('Invalid OpenAI response');
      }

      const aiResponse = data.choices[0].message.content;
      console.log('AI response content:', aiResponse);

      // Save AI response
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from('training_messages')
        .insert({
          session_id: sessionId,
          sender_type: 'ai',
          content: aiResponse,
        })
        .select()
        .single();

      if (aiMessageError) {
        console.error('Error saving AI response:', aiMessageError);
        return new Response(
          JSON.stringify({ error: 'Error al guardar respuesta de AI: ' + aiMessageError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Respuesta de AI guardada:', aiMessageData);

      return new Response(
        JSON.stringify({ 
          success: true, 
          response: aiResponse,
          message: aiMessageData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error with OpenAI:', error);
      return new Response(
        JSON.stringify({ error: 'Error al generar respuesta: ' + error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in handleChatMessage:', error);
    return new Response(
      JSON.stringify({ error: 'Error al procesar mensaje: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Función para finalizar la sesión y generar evaluación
async function handleEndSession(supabase, openaiApiKey, sessionId, corsHeaders) {
  // Verificar parámetros requeridos
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'ID de sesión no proporcionado' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  try {
    // Verificar que la sesión exista
    const { data: existingSession, error: sessionError } = await supabase
      .from('training_sessions')
      .select('id, started_at')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('Error al buscar sesión:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Error al verificar sesión: ' + sessionError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!existingSession) {
      return new Response(
        JSON.stringify({ error: 'Sesión no encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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
      throw new Error('Error al actualizar la sesión: ' + updateError.message);
    }

    // Obtener todos los mensajes de la sesión
    const { data: messagesData, error: messagesError } = await supabase
      .from('training_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('sent_at', { ascending: true });

    if (messagesError) {
      throw new Error('Error al obtener mensajes: ' + messagesError.message);
    }

    if (!messagesData || messagesData.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          evaluation: {
            text: "No hay suficientes mensajes para realizar una evaluación.",
            score: 50,
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
    try {
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

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error de OpenAI en evaluación:', response.status, errorData);
        throw new Error(`Error de OpenAI (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]) {
        console.error('Respuesta de OpenAI inválida:', data);
        throw new Error('Respuesta de OpenAI inválida');
      }

      const evaluationText = data.choices[0].message.content;
      
      // Extraer puntuación de la evaluación
      const scoreMatch = evaluationText.match(/Puntuación global: (\d+)/);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 70; // Valor por defecto si no se puede extraer

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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error con OpenAI durante la evaluación:', error);
      // Proporcionar una evaluación de respaldo en caso de fallo de OpenAI
      const fallbackEvaluation = {
        text: "No se pudo generar una evaluación detallada en este momento. Por favor, contacta al administrador.",
        score: 60
      };
      
      return new Response(
        JSON.stringify({
          success: true,
          evaluation: fallbackEvaluation,
          error: error.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error al finalizar sesión:', error);
    return new Response(
      JSON.stringify({ error: 'Error al finalizar sesión: ' + error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
