
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CodeEntryScreen } from '@/components/training/CodeEntryScreen';
import { NameEntryScreen } from '@/components/training/NameEntryScreen';
import { ChatScreen } from '@/components/training/ChatScreen';
import { ResultScreen } from '@/components/training/ResultScreen';
import { toast } from '@/components/ui/sonner';

interface ChatMessage {
  id: string;
  sender_type: 'ai' | 'candidate';
  content: string;
  sent_at: string;
  session_id: string;
}

const TrainingChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('code'); // 'code', 'name', 'chat', 'result'
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const [chatEnded, setChatEnded] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const { toast: hookToast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Parse query parameters to preload code (if exists)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const codeParam = queryParams.get('code');
    if (codeParam) {
      setCode(codeParam.toUpperCase());
    }
  }, [location]);

  // Reset messages when starting a new session
  useEffect(() => {
    if (sessionId) {
      console.log("New session started, clearing previous messages");
      setMessages([]);
    }
  }, [sessionId]);

  // Function to handle edge function calls with retry logic
  const callEdgeFunction = async (functionName: string, payload: any, maxAttempts = maxRetries) => {
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      try {
        console.log(`Attempt ${attempt + 1} calling edge function ${functionName}...`);
        
        // Direct URL approach
        const response = await fetch(`https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
            'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z29jZHRlc2FjemJmcndibHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzA0MjUsImV4cCI6MjA2MjE0NjQyNX0.nHNWlTMfxuwAKYaiw145IFTAx3R3sbfWygviPVSH-Zc"
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Edge function returned error: ${response.status}, ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Edge function ${functionName} response:`, data);
        return data;
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        attempt++;
        
        if (attempt < maxAttempts) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 200;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Re-throw the last error if all attempts failed
        }
      }
    }
  };

  // Validate and verify the code
  const validateCode = async () => {
    if (!code.trim()) {
      toast.error('Por favor, ingresa un código de entrenamiento');
      return;
    }

    setLoading(true);
    setRetryCount(0);
    try {
      console.log('Verificando código en cliente:', code.trim());
      
      // Try to call edge function with retry logic
      const data = await callEdgeFunction('training-chat', {
        action: 'validate-code',
        trainingCode: code.trim()
      });
      
      if (!data || data.error) {
        console.error('Respuesta de validación:', data);
        throw new Error(data?.error || 'Código no válido o no encontrado');
      }
      
      console.log('Código validado correctamente:', data);
      
      // Success! Advance to next step
      toast.success('Código válido');
      setStep('name');
    } catch (error: any) {
      console.error('Error al validar código:', error);
      setRetryCount(prevCount => prevCount + 1);
      
      // Show appropriate error message based on retry count
      if (retryCount >= maxRetries - 1) {
        toast.error('No se pudo conectar con el servidor después de varios intentos. Por favor, inténtalo más tarde.');
      } else {
        toast.error(error.message || 'Código no válido');
      }
    } finally {
      setLoading(false);
    }
  };

  // Start training session
  const startTraining = async () => {
    if (!name.trim()) {
      toast.error('Por favor, ingresa tu nombre');
      return;
    }

    setLoading(true);
    setRetryCount(0);
    try {
      console.log('Iniciando sesión con código:', code.trim(), 'y nombre:', name.trim());
      
      // Clear previous messages
      setMessages([]);
      
      // Try to call edge function with retry logic
      const data = await callEdgeFunction('training-chat', {
        action: 'start-session',
        trainingCode: code.trim(),
        candidateName: name.trim(),
      });
      
      if (!data || !data.session) {
        console.error('Respuesta inválida:', data);
        throw new Error(data?.error || 'Respuesta inválida del servidor');
      }
      
      console.log('Sesión iniciada correctamente:', data.session);
      setSessionId(data.session.id);
      
      // Initialize message list with empty array (no welcome message)
      setMessages([]);
      
      setStep('chat');
    } catch (error: any) {
      console.error('Error al iniciar entrenamiento:', error);
      setRetryCount(prevCount => prevCount + 1);
      
      // Show appropriate error message based on retry count
      if (retryCount >= maxRetries - 1) {
        toast.error('No se pudo conectar con el servidor después de varios intentos. Por favor, inténtalo más tarde.');
      } else {
        toast.error(error.message || 'No se pudo iniciar la sesión de entrenamiento');
      }
    } finally {
      setLoading(false);
    }
  };

  // End training chat
  const endChat = async () => {
    if (chatEnded) return;
    
    setChatEnded(true);
    setRetryCount(0);
    
    try {
      const data = await callEdgeFunction('training-chat', {
        action: 'end-session',
        sessionId,
      });
      
      if (!data || data.error) {
        throw new Error(data?.error || 'Error al finalizar sesión');
      }
      
      setEvaluation(data.evaluation);
      setStep('result');
    } catch (error: any) {
      console.error('Error al finalizar chat:', error);
      setRetryCount(prevCount => prevCount + 1);
      
      // Show appropriate error message based on retry count
      if (retryCount >= maxRetries - 1) {
        toast.error('No se pudo conectar con el servidor después de varios intentos.');
      } else {
        toast.error('No se pudo finalizar la sesión correctamente');
      }
    }
  };

  // Handle input changes
  const handleCodeChange = (newCode: string) => {
    setCode(newCode.toUpperCase());
  };

  const handleNameChange = (newName: string) => {
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
            callEdgeFunction={callEdgeFunction}
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
