
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Clock } from 'lucide-react';

const TrainingChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('code'); // 'code', 'name', 'chat', 'result'
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos (300 segundos)
  const [chatEnded, setChatEnded] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const timerRef = useRef(null);

  // Parsear parámetros de consulta para precargar el código (si existe)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const codeParam = queryParams.get('code');
    if (codeParam) {
      setCode(codeParam.toUpperCase());
    }
  }, [location]);

  // Suscribirse a mensajes en tiempo real cuando se establece una sesión
  useEffect(() => {
    if (sessionId) {
      const channel = supabase
        .channel(`training-chat-${sessionId}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'training_messages', filter: `session_id=eq.${sessionId}` }, 
          (payload) => {
            if (payload.new) {
              setMessages(prevMessages => [...prevMessages, payload.new]);
            }
          })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [sessionId]);

  // Iniciar el temporizador cuando comienza el chat
  useEffect(() => {
    if (step === 'chat' && !chatEnded) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            endChat();
            clearInterval(timerRef.current);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [step, chatEnded]);

  // Hacer scroll al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Validar y verificar el código
  const validateCode = async () => {
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor, ingresa un código de entrenamiento',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar si el código existe y es válido
      const { data, error } = await supabase
        .from('training_codes')
        .select('id, is_used, expires_at')
        .eq('code', code.trim())
        .single();
      
      if (error) {
        throw new Error('Código no válido o no encontrado');
      }
      
      if (data.is_used) {
        throw new Error('Este código ya ha sido utilizado');
      }
      
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (now > expiresAt) {
        throw new Error('Este código ha expirado');
      }

      // Avanzar al siguiente paso
      setStep('name');
    } catch (error) {
      console.error('Error al validar código:', error);
      toast({
        title: 'Error',
        description: error.message || 'Código no válido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Iniciar sesión de entrenamiento
  const startTraining = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor, ingresa tu nombre',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Usar directamente supabase functions para evitar errores de formato
      const { data, error } = await supabase.functions.invoke('training-chat', {
        body: {
          action: 'start-session',
          trainingCode: code,
          candidateName: name,
        },
      });
      
      if (error) {
        console.error('Error llamando a la función:', error);
        throw new Error(error.message || 'Error al iniciar sesión');
      }
      
      if (!data || !data.session) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      setSessionId(data.session.id);
      setMessages([{
        id: 'welcome',
        sender_type: 'ai',
        content: data.welcomeMessage,
        sent_at: new Date().toISOString(),
      }]);
      setStep('chat');
    } catch (error) {
      console.error('Error al iniciar entrenamiento:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo iniciar la sesión de entrenamiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensaje
  const sendMessage = async () => {
    if (!message.trim() || submitting || chatEnded) return;
    
    setSubmitting(true);
    try {
      // Agregar mensaje del usuario inmediatamente para mejor UX
      const userMessage = {
        id: `temp-${Date.now()}`,
        sender_type: 'candidate',
        content: message.trim(),
        sent_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      
      // Enviar mensaje a través de supabase functions
      const { data, error } = await supabase.functions.invoke('training-chat', {
        body: {
          action: 'send-message',
          sessionId,
          message: userMessage.content,
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Finalizar chat de entrenamiento
  const endChat = async () => {
    if (chatEnded) return;
    
    setChatEnded(true);
    clearInterval(timerRef.current);
    
    try {
      const { data, error } = await supabase.functions.invoke('training-chat', {
        body: {
          action: 'end-session',
          sessionId,
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Error al finalizar sesión');
      }
      
      setEvaluation(data.evaluation);
      setStep('result');
    } catch (error) {
      console.error('Error al finalizar chat:', error);
      toast({
        title: 'Error',
        description: 'No se pudo finalizar la sesión correctamente',
        variant: 'destructive',
      });
    }
  };

  // Manejar envío con Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Formatear tiempo restante
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Componente de entrada de código
  const CodeScreen = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Chat de Entrenamiento</CardTitle>
        <CardDescription className="text-center">
          Ingresa tu código de entrenamiento para comenzar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Introduce tu código (ej: ABC123)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center uppercase font-mono text-lg"
              maxLength={10}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={validateCode} 
          className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
          disabled={loading}
        >
          {loading ? 'Verificando...' : 'Continuar'}
        </Button>
      </CardFooter>
    </Card>
  );

  // Componente de entrada de nombre
  const NameScreen = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">¿Cómo te llamas?</CardTitle>
        <CardDescription className="text-center">
          Ingresa tu nombre para que podamos identificarte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          onClick={startTraining} 
          className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
          disabled={loading}
        >
          {loading ? 'Iniciando...' : 'Iniciar Entrenamiento'}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setStep('code')}
          className="w-full"
        >
          Volver
        </Button>
      </CardFooter>
    </Card>
  );

  // Componente de chat
  const ChatScreen = () => (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Simulación de Chat con Cliente</CardTitle>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            <span className={timeLeft < 60 ? 'text-red-500' : 'text-gray-600'}>
              {formatTimeLeft()}
            </span>
          </div>
        </div>
        <CardDescription>
          Actúa como representante de CONVERT-IA y responde a las preguntas del cliente
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`mb-4 flex ${msg.sender_type === 'candidate' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  msg.sender_type === 'candidate'
                    ? 'bg-hrm-steel-blue text-white'
                    : 'bg-gray-100'
                }`}
              >
                <p>{msg.content}</p>
                <div className="text-xs mt-1 opacity-70">
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Escribe tu mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={submitting || chatEnded}
          />
          <Button
            onClick={sendMessage}
            disabled={submitting || chatEnded || !message.trim()}
            className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            onClick={endChat}
            disabled={chatEnded}
          >
            Finalizar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  // Componente de resultados
  const ResultScreen = () => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Evaluación Completada</CardTitle>
        <CardDescription>
          Gracias por participar en esta simulación de entrenamiento
        </CardDescription>
      </CardHeader>
      <CardContent>
        {evaluation ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-hrm-dark-cyan text-white w-32 h-32 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold">{evaluation.score}</div>
                  <div className="text-sm">puntos</div>
                </div>
              </div>
            </div>
            <div className="whitespace-pre-line bg-gray-50 p-4 rounded-lg">
              {evaluation.text}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Cargando resultados...</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          onClick={() => navigate('/')}
          className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
        >
          Volver al Inicio
        </Button>
      </CardFooter>
    </Card>
  );

  // Renderizar pantalla según el paso actual
  const renderScreen = () => {
    switch (step) {
      case 'code':
        return <CodeScreen />;
      case 'name':
        return <NameScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'result':
        return <ResultScreen />;
      default:
        return <CodeScreen />;
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      {renderScreen()}
    </div>
  );
};

export default TrainingChat;
