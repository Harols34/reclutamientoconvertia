
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatbotInterfaceProps {
  userType: 'public' | 'admin';
}

interface ChatbotKnowledge {
  topic: string;
  question: string;
  answer: string;
}

const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({ userType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatbotConfig, setChatbotConfig] = useState<any>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<ChatbotKnowledge[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch chatbot configuration from the database
    const fetchChatbotConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbot_configurations')
          .select('*')
          .single();
        
        if (error) throw error;
        if (data) setChatbotConfig(data);
      } catch (err) {
        console.error('Error fetching chatbot config:', err);
      }
    };
    
    // Fetch chatbot knowledge base
    const fetchKnowledgeBase = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbot_knowledge')
          .select('topic, question, answer');
        
        if (error) throw error;
        if (data) setKnowledgeBase(data);
      } catch (err) {
        console.error('Error fetching chatbot knowledge:', err);
      }
    };
    
    fetchChatbotConfig();
    fetchKnowledgeBase();

    // Add initial welcome message
    const welcomeMessage = {
      id: crypto.randomUUID(),
      content: 'Hola, soy el asistente virtual de CONVERT-IA RECLUTAMIENTO. ¿En qué puedo ayudarte?',
      sender: 'assistant' as const,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to find answer from knowledge base
  const findAnswer = (question: string): string | null => {
    // Normalize the question for better matching (lowercase, remove punctuation)
    const normalizedQuestion = question.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Check if the question directly matches any in the knowledge base
    for (const entry of knowledgeBase) {
      const normalizedKnowledgeQuestion = entry.question.toLowerCase().replace(/[^\w\s]/g, '');
      
      if (normalizedQuestion.includes(normalizedKnowledgeQuestion) || 
          normalizedKnowledgeQuestion.includes(normalizedQuestion)) {
        return entry.answer;
      }
      
      // Check for keyword matches
      const keywords = normalizedKnowledgeQuestion.split(' ');
      const questionWords = normalizedQuestion.split(' ');
      
      // If multiple keywords match (more than 60% of the question words), return this answer
      const matchCount = keywords.filter(word => questionWords.includes(word)).length;
      if (matchCount >= Math.max(2, Math.floor(keywords.length * 0.6))) {
        return entry.answer;
      }
    }
    
    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      id: crypto.randomUUID(),
      content: input.trim(),
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // First check if we have a direct match in our knowledge base
      const knowledgeAnswer = findAnswer(input.trim());
      
      if (knowledgeAnswer) {
        // If we have a match, use it directly without calling OpenAI
        const aiMessage = {
          id: crypto.randomUUID(),
          content: knowledgeAnswer,
          sender: 'assistant' as const,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // If no match in knowledge base, try OpenAI
        // Get the appropriate context based on user type
        const context = chatbotConfig ? 
          (userType === 'public' ? chatbotConfig.public_responses : chatbotConfig.admin_responses) : 
          {};
        
        // Call the OpenAI edge function
        const { data, error } = await supabase.functions
          .invoke('openai-assistant', {
            body: {
              prompt: input.trim(),
              type: 'chatbot',
              context: JSON.stringify(context)
            }
          });
        
        if (error) {
          console.error('Supabase function error:', error);
          throw new Error('Error connecting to the AI assistant');
        }
        
        if (!data || !data.response) {
          throw new Error('Invalid response from AI assistant');
        }
        
        const aiMessage = {
          id: crypto.randomUUID(),
          content: data.response,
          sender: 'assistant' as const,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error('Error sending message to AI:', err);
      
      const errorMessage = {
        id: crypto.randomUUID(),
        content: 'Lo siento, no tengo información sobre esa consulta específica. ¿Puedo ayudarte con algo más relacionado a nuestros servicios de reclutamiento?',
        sender: 'assistant' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-80 sm:w-96 flex flex-col overflow-hidden max-h-[500px] border border-gray-200">
          <div className="bg-hrm-dark-cyan text-white p-3 flex justify-between items-center">
            <h3 className="font-medium">Asistente CONVERT-IA</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-hrm-steel-blue p-1 h-auto"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </Button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto max-h-80">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`mb-3 ${
                  message.sender === 'user' ? 'ml-auto text-right' : ''
                }`}
              >
                <div
                  className={`inline-block rounded-lg p-2 max-w-[80%] ${
                    message.sender === 'user'
                      ? 'bg-hrm-steel-blue text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center mb-3">
                <div className="inline-block bg-gray-100 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t">
            <div className="flex">
              <Input
                placeholder="Escribe tu mensaje..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 mr-2"
              />
              <Button 
                size="icon" 
                className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                onClick={handleSendMessage}
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          className="rounded-full w-12 h-12 bg-hrm-dark-cyan hover:bg-hrm-steel-blue shadow-lg flex items-center justify-center"
          onClick={() => setIsOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </Button>
      )}
    </div>
  );
};

export default ChatbotInterface;
