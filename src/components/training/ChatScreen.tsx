
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Send, Clock } from 'lucide-react';
import { MessageList } from './MessageList';
import { SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { RealtimeConnection } from '@/utils/supabase-realtime';

interface ChatScreenProps {
  sessionId: string | null;
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  chatEnded: boolean;
  setChatEnded: React.Dispatch<React.SetStateAction<boolean>>;
  onEndChat: () => Promise<void>;
  supabase: SupabaseClient;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ 
  sessionId, 
  messages, 
  setMessages, 
  timeLeft, 
  setTimeLeft, 
  chatEnded, 
  setChatEnded, 
  onEndChat,
  supabase
}) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [initialHint, setInitialHint] = useState(true);
  const [channelEstablished, setChannelEstablished] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const realtimeRef = useRef<RealtimeConnection | null>(null);
  const { toast } = useToast();
  const receivedMessagesRef = useRef<Set<string>>(new Set());

  // Start timer when chat begins
  useEffect(() => {
    if (!chatEnded) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            onEndChat();
            if (timerRef.current) clearInterval(timerRef.current);
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
  }, [chatEnded, onEndChat, setTimeLeft]);

  // Auto-focus on message input
  useEffect(() => {
    if (messageInputRef.current) {
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  }, []);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!sessionId) return;
    
    // Function to handle new messages
    const handleNewMessage = (payload: any) => {
      if (!payload.new || !payload.new.id) return;
      
      // Check if we've already processed this message to avoid duplicates
      if (receivedMessagesRef.current.has(payload.new.id)) {
        console.log('Skipping duplicate message:', payload.new.id);
        return;
      }
      
      receivedMessagesRef.current.add(payload.new.id);
      
      // Add new message to state
      setMessages(prevMessages => {
        const messageExists = prevMessages.some(msg => msg.id === payload.new.id);
        if (!messageExists) {
          console.log('Adding new message to state:', payload.new);
          
          // Hide the initial hint once we start receiving messages
          if (initialHint) setInitialHint(false);
          
          return [...prevMessages, payload.new];
        }
        return prevMessages;
      });
    };

    // Create the realtime connection
    const realtime = new RealtimeConnection(supabase, {
      sessionId,
      onMessage: handleNewMessage,
      onConnectionChange: (connected) => {
        setChannelEstablished(connected);
        setReconnecting(!connected);
      },
      retryLimit: 30, // Increase retry limit
      retryDelay: 2000 // Slightly shorter retry delay
    });
    
    realtimeRef.current = realtime;
    realtime.connect();

    // Clean up the realtime connection when the component unmounts
    return () => {
      if (realtimeRef.current) {
        realtimeRef.current.disconnect();
        realtimeRef.current = null;
      }
    };
  }, [sessionId, setMessages, supabase, initialHint]);

  // Debug: monitor messages changes
  useEffect(() => {
    console.log('Messages updated in ChatScreen:', messages);
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || submitting || chatEnded) return;
    
    setSubmitting(true);
    try {
      console.log('Sending message to session:', sessionId);
      
      // Add user message immediately for better UX
      const userMessage = {
        id: `temp-${Date.now()}`,
        sender_type: 'candidate',
        content: message.trim(),
        sent_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      
      // Send message through supabase functions
      const { data, error } = await supabase.functions.invoke('training-chat', {
        body: {
          action: 'send-message',
          sessionId,
          message: userMessage.content,
        },
      });
      
      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: error.message || 'Error al enviar mensaje',
          variant: 'destructive',
        });
        throw new Error(error.message || 'Error al enviar mensaje');
      }
      
      console.log('Message sent successfully:', data);
      
      // If initializing chat, hide the hint
      if (initialHint) {
        setInitialHint(false);
      }

      // Check if we need to re-establish the real-time connection
      if (!channelEstablished && realtimeRef.current) {
        console.log('Real-time connection not established. Attempting to reconnect...');
        realtimeRef.current.disconnect();
        setTimeout(() => {
          if (realtimeRef.current) realtimeRef.current.connect();
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      // Focus back on the input after sending
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }
  };

  // Handle pressing Enter to send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Force reconnect function
  const forceReconnect = () => {
    if (realtimeRef.current) {
      setReconnecting(true);
      toast({
        title: 'Reconectando',
        description: 'Intentando reconectar al servicio de mensajes en tiempo real...',
      });
      
      realtimeRef.current.disconnect();
      setTimeout(() => {
        if (realtimeRef.current) realtimeRef.current.connect();
      }, 1000);
    }
  };

  return (
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
          Inicia la conversación como representante de CONVERT-IA y espera la respuesta del cliente
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto p-4">
          {initialHint && messages.length === 0 && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-blue-800 text-sm">
              <strong>Sugerencia:</strong> Inicia la conversación presentándote y ofreciendo ayuda.
              Por ejemplo: "Hola, soy [tu nombre] de CONVERT-IA, ¿en qué puedo ayudarte hoy?"
            </div>
          )}
          <MessageList messages={messages} />
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
        <div className="flex flex-col w-full gap-2">
          <div className="flex w-full gap-2">
            <Input
              ref={messageInputRef}
              placeholder="Escribe tu mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={submitting || chatEnded}
              autoFocus
              className="flex-1"
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
              onClick={onEndChat}
              disabled={chatEnded}
            >
              Finalizar
            </Button>
          </div>
          {!channelEstablished && (
            <div className="flex items-center justify-between text-amber-600 text-sm mt-2 p-2 bg-amber-50 rounded">
              <span>Reconectando al servicio de mensajes en tiempo real...</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={forceReconnect} 
                className="text-xs"
                disabled={reconnecting}
              >
                Forzar reconexión
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
