import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  sender_type: 'ai' | 'candidate';
  content: string;
  sent_at: string;
  session_id: string;
}

interface ChatScreenProps {
  sessionId: string | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  chatEnded: boolean;
  setChatEnded: React.Dispatch<React.SetStateAction<boolean>>;
  onEndChat: () => void;
  supabase: any;
  callEdgeFunction?: (functionName: string, payload: any) => Promise<any>;
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
  supabase,
  callEdgeFunction
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (sessionId && !chatEnded && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && !chatEnded) {
      setChatEnded(true);
      onEndChat();
    }

    return () => clearInterval(intervalId);
  }, [sessionId, chatEnded, timeLeft, setTimeLeft, onEndChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update the sendMessage function to use the callEdgeFunction method from the parent
  const sendMessage = async (content: string) => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Add user message to UI first for better UX
      const userMessage = {
        id: crypto.randomUUID(),
        content,
        sender_type: 'candidate' as const,
        sent_at: new Date().toISOString(),
        session_id: sessionId!
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInputValue('');

      // If we have the callEdgeFunction helper method from the parent, use it
      let data;
      if (typeof callEdgeFunction === 'function') {
        data = await callEdgeFunction('training-chat', {
          action: 'send-message',
          sessionId: sessionId,
          message: content
        });
      } else {
        // Fallback to the original method if the helper isn't available
        const { data: responseData, error } = await supabase.functions.invoke('training-chat', {
          body: { action: 'send-message', sessionId, message: content }
        });
        
        if (error) throw error;
        data = responseData;
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'Error al enviar el mensaje');
      }

      // Add AI response to chat
      const aiResponse = {
        id: crypto.randomUUID(),
        content: data.response,
        sender_type: 'ai' as const,
        sent_at: new Date().toISOString(),
        session_id: sessionId!
      };

      setMessages(prevMessages => [...prevMessages, aiResponse]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar el mensaje. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-hrm-dark-cyan">
          Chat de Entrenamiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p>Tiempo restante: {formatTime(timeLeft)}</p>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onEndChat} 
            disabled={chatEnded}
          >
            Terminar Chat
          </Button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`text-sm ${message.sender_type === 'candidate' ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${message.sender_type === 'candidate' ? 'bg-hrm-steel-blue text-white' : 'bg-gray-100 text-gray-800'}`}
              >
                {message.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(message.sent_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center">
          <Input
            type="text"
            placeholder="Escribe tu mensaje..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(inputValue);
              }
            }}
            disabled={chatEnded || isSubmitting}
            className="flex-1 mr-2"
          />
          <Button 
            onClick={() => sendMessage(inputValue)} 
            disabled={chatEnded || isSubmitting || !inputValue.trim()}
            className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue transition-colors"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
