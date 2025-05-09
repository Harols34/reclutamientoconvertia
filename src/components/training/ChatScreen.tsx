import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Send, Clock, RefreshCw } from 'lucide-react';
import { MessageList } from './MessageList';
import { SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { RealtimeConnection } from '@/utils/supabase-realtime';

interface Message {
  id: string;
  sender_type: 'ai' | 'candidate';
  content: string;
  sent_at: string;
  session_id?: string;
}

interface ChatScreenProps {
  sessionId: string | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
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
  const [isConnected, setIsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const realtimeConnection = useRef<RealtimeConnection | null>(null);
  const { toast } = useToast();

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

  // Set up real-time connection
  useEffect(() => {
    if (!sessionId) return;
    
    console.log('Setting up real-time connection for session:', sessionId);

    // Initialize the real-time connection
    realtimeConnection.current = new RealtimeConnection(supabase, {
      sessionId,
      debugMode: true,
      onMessage: (payload) => {
        if (!payload.new || !payload.new.id) return;
        
        console.log('Received message from real-time connection:', payload.new);
        
        // Add new message to state, ensuring it matches the Message type
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => msg.id === payload.new.id);
          
          if (!messageExists) {
            const newMessage: Message = {
              id: payload.new.id,
              sender_type: payload.new.sender_type as 'ai' | 'candidate',
              content: payload.new.content,
              sent_at: payload.new.sent_at,
            };
            
            console.log('Adding new message to messages state:', newMessage);
            return [...prevMessages, newMessage];
          }
          
          return prevMessages;
        });
        
        // Hide initial hint once we have messages
        if (initialHint) setInitialHint(false);
      },
      onConnectionChange: (status) => {
        console.log('Connection status changed:', status);
        setIsConnected(status);
        setReconnecting(!status);
      }
    });
    
    // Connect to the real-time channel
    realtimeConnection.current.connect();
    
    // Load initial messages
    fetchInitialMessages();
    
    return () => {
      console.log('Cleaning up real-time connection');
      if (realtimeConnection.current) {
        realtimeConnection.current.disconnect();
      }
    };
  }, [sessionId, setMessages, supabase, initialHint]);

  // Debug: monitor messages changes
  useEffect(() => {
    console.log('Messages updated in ChatScreen:', messages.length);
    
    // Log message counts by type
    const aiMessages = messages.filter(msg => msg.sender_type === 'ai');
    const candidateMessages = messages.filter(msg => msg.sender_type === 'candidate');
    
    console.log('AI messages:', aiMessages.length);
    console.log('Candidate messages:', candidateMessages.length);
    
    if (messages.length > 0) {
      console.log('Last message:', {
        id: messages[messages.length - 1].id,
        type: messages[messages.length - 1].sender_type,
        content: messages[messages.length - 1].content.substring(0, 50) + '...'
      });
    }
  }, [messages]);

  // Function to fetch initial messages
  const fetchInitialMessages = async () => {
    if (!sessionId) return;
    
    try {
      console.log('Fetching initial messages for session:', sessionId);
      setReconnecting(true);
      
      const { data, error } = await supabase
        .from('training_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('sent_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los mensajes',
          variant: 'destructive',
        });
        return;
      }
      
      if (data && data.length > 0) {
        console.log('Fetched initial messages:', data.length);
        
        // Add messages to state
        setMessages(prevMessages => {
          // If we have no messages, just set the fetched data
          if (prevMessages.length === 0) {
            // Ensure data matches the Message interface
            const typedMessages: Message[] = data.map(msg => ({
              id: msg.id,
              sender_type: msg.sender_type as 'ai' | 'candidate',
              content: msg.content,
              sent_at: msg.sent_at
            }));
            return typedMessages;
          }
          
          // Otherwise, add only new messages
          const existingIds = new Set(prevMessages.map(msg => msg.id));
          const newMessages = data
            .filter(msg => !existingIds.has(msg.id))
            .map(msg => ({
              id: msg.id,
              sender_type: msg.sender_type as 'ai' | 'candidate',
              content: msg.content,
              sent_at: msg.sent_at
            }));
          
          if (newMessages.length > 0) {
            console.log(`Adding ${newMessages.length} new messages from fetch`);
            return [...prevMessages, ...newMessages];
          }
          
          return prevMessages;
        });
        
        // Hide hint if we have messages
        if (data.length > 0) setInitialHint(false);
      }
    } catch (err) {
      console.error('Error in fetchInitialMessages:', err);
    } finally {
      setReconnecting(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || submitting || chatEnded) return;
    
    setSubmitting(true);
    try {
      console.log('Sending message to session:', sessionId);
      
      // Add user message immediately for better UX
      const userMessage: Message = {
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

  // Manual refresh function
  const refreshMessages = async () => {
    console.log('Manually refreshing messages...');
    setReconnecting(true);
    
    toast({
      title: 'Actualizando mensajes',
      description: 'Obteniendo los mensajes más recientes...',
    });
    
    // Reconnect the real-time connection
    if (realtimeConnection.current) {
      realtimeConnection.current.forceTriggerReconnect();
      realtimeConnection.current.clearMessageCache();
    }
    
    // Fetch messages again
    await fetchInitialMessages();
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
              <strong>Sugerencia:</strong> Inicia la conversación presentándote y ofreciendo un producto.
              Por ejemplo: "Hola, soy [tu nombre] de CONVERT-IA, vengo a ofrecerte el servicio *******"
            </div>
          )}
          <MessageList messages={messages} />
          
          {reconnecting && (
            <div className="flex justify-center my-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          )}
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
          <div className="flex justify-center mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshMessages}
              className="text-xs"
            >
              Refrescar mensajes
              <RefreshCw className={`h-3 w-3 ml-1 ${submitting ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="text-xs text-center text-gray-500 mt-1">
            {isConnected ? 
              '✓ Conectado en tiempo real' : 
              'No conectado en tiempo real - usa el botón de refrescar si faltan mensajes'}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
