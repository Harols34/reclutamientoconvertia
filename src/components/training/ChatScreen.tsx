
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Send, Clock } from 'lucide-react';
import { MessageList } from './MessageList';
import { SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

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
  const messageInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
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

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscription for session:', sessionId);
    
    // Subscribe to message changes for this session
    const channel = supabase
      .channel(`training-chat-${sessionId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'training_messages', 
          filter: `session_id=eq.${sessionId}` 
        }, 
        (payload) => {
          console.log('Received real-time message:', payload);
          if (payload.new) {
            // Only add the message if it's not already in the list
            setMessages(prevMessages => {
              const messageExists = prevMessages.some(msg => msg.id === payload.new.id);
              if (!messageExists) {
                return [...prevMessages, payload.new];
              }
              return prevMessages;
            });
          }
        })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    console.log('Subscription channel created:', channel);
        
    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, setMessages, supabase]);

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
          Actúa como representante de CONVERT-IA y responde a las preguntas del cliente
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto p-4">
          <MessageList messages={messages} />
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
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
      </CardFooter>
    </Card>
  );
};
