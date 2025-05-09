
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CodeEntryScreen } from '@/components/training/CodeEntryScreen';
import { NameEntryScreen } from '@/components/training/NameEntryScreen';
import { ChatScreen } from '@/components/training/ChatScreen';
import { ResultScreen } from '@/components/training/ResultScreen';

const TrainingChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('code'); // 'code', 'name', 'chat', 'result'
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const [chatEnded, setChatEnded] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const { toast } = useToast();

  // Parse query parameters to preload code (if exists)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const codeParam = queryParams.get('code');
    if (codeParam) {
      setCode(codeParam.toUpperCase());
    }
  }, [location]);

  // Validate and verify the code
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
      console.log('Verificando código en cliente:', code.trim());
      
      // Verify directly with Supabase function
      const { data, error } = await supabase.functions.invoke('training-chat', {
        body: {
          action: 'validate-code',
          trainingCode: code.trim()
        },
      });
      
      if (error) {
        console.error('Error al validar código:', error);
        throw new Error(error.message || 'Error al validar código');
      }
      
      if (!data || data.error) {
        console.error('Respuesta de validación:', data);
        throw new Error(data?.error || 'Código no válido o no encontrado');
      }
      
      console.log('Código validado correctamente:', data);
      
      // Advance to next step
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

  // Start training session
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
      console.log('Iniciando sesión con código:', code.trim(), 'y nombre:', name.trim());
      
      // Use Supabase functions directly
      const { data, error } = await supabase.functions.invoke('training-chat', {
        body: {
          action: 'start-session',
          trainingCode: code.trim(),
          candidateName: name.trim(),
        },
      });
      
      if (error) {
        console.error('Error llamando a la función:', error);
        throw new Error(error.message || 'Error al iniciar sesión');
      }
      
      if (!data || !data.session) {
        console.error('Respuesta inválida:', data);
        throw new Error(data?.error || 'Respuesta inválida del servidor');
      }
      
      console.log('Sesión iniciada correctamente:', data.session);
      setSessionId(data.session.id);
      
      // Initialize message list with welcome message
      if (data.welcomeMessage) {
        setMessages([{
          id: 'welcome',
          sender_type: 'ai',
          content: data.welcomeMessage,
          sent_at: new Date().toISOString(),
        }]);
      }
      
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

  // End training chat
  const endChat = async () => {
    if (chatEnded) return;
    
    setChatEnded(true);
    
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

  // Handle input changes
  const handleCodeChange = (newCode) => {
    setCode(newCode.toUpperCase());
  };

  const handleNameChange = (newName) => {
    setName(newName);
  };

  // Render appropriate screen based on current step
  const renderScreen = () => {
    switch (step) {
      case 'code':
        return (
          <CodeEntryScreen 
            code={code} 
            onCodeChange={handleCodeChange} 
            onValidate={validateCode} 
            loading={loading} 
          />
        );
      case 'name':
        return (
          <NameEntryScreen 
            name={name} 
            onNameChange={handleNameChange} 
            onStart={startTraining} 
            onBack={() => setStep('code')} 
            loading={loading} 
          />
        );
      case 'chat':
        return (
          <ChatScreen 
            sessionId={sessionId} 
            messages={messages} 
            setMessages={setMessages} 
            timeLeft={timeLeft} 
            setTimeLeft={setTimeLeft} 
            chatEnded={chatEnded} 
            setChatEnded={setChatEnded} 
            onEndChat={endChat} 
            supabase={supabase}
          />
        );
      case 'result':
        return (
          <ResultScreen 
            evaluation={evaluation} 
            onReturn={() => navigate('/')} 
          />
        );
      default:
        return <CodeEntryScreen />;
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      {renderScreen()}
    </div>
  );
};

export default TrainingChat;
