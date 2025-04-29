
import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatbotProps {
  userType: 'admin' | 'public';
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot: React.FC<ChatbotProps> = ({ userType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: userType === 'admin' 
        ? '¡Hola! Soy tu asistente IA. ¿Cómo puedo ayudarte a gestionar tu plataforma de reclutamiento?' 
        : '¡Hola! Soy tu asistente IA. ¿Cómo puedo ayudarte con las ofertas de trabajo?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate bot response - in a real application, this would call an API
    setTimeout(() => {
      const botResponses = {
        admin: [
          "Puedo ayudarte a gestionar candidatos, vacantes y campañas.",
          "Para crear una nueva vacante, ve a la sección 'Vacantes' y haz clic en 'Nueva Vacante'.",
          "Los reportes se actualizan automáticamente cada día a medianoche.",
          "¿Necesitas ayuda con alguna función específica?",
        ],
        public: [
          "Puedes ver todas las vacantes disponibles en la sección 'Vacantes'.",
          "Para aplicar, haz clic en 'Postularse' en la vacante que te interese.",
          "Necesitarás subir tu CV en formato PDF, DOC o DOCX.",
          "¿Tienes alguna pregunta sobre el proceso de aplicación?",
        ],
      };

      const randomIndex = Math.floor(Math.random() * botResponses[userType].length);
      const botMessage: Message = {
        id: Date.now().toString(),
        text: botResponses[userType][randomIndex],
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <>
      {/* Chatbot toggle button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg p-0 bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chatbot panel */}
      <div
        className={cn(
          "fixed bottom-20 right-4 w-80 bg-white rounded-lg shadow-xl border border-hrm-light-gray overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{ height: isOpen ? '400px' : '0' }}
      >
        {/* Chatbot header */}
        <div className="bg-hrm-dark-cyan text-white p-3 flex justify-between items-center">
          <h3 className="font-medium">Asistente IA</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 text-white hover:bg-hrm-steel-blue rounded-full p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chatbot messages */}
        <ScrollArea className="h-[300px] p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[80%] p-3 rounded-lg",
                  message.sender === 'user'
                    ? "bg-hrm-dark-cyan text-white ml-auto rounded-br-none"
                    : "bg-hrm-light-gray text-gray-800 rounded-bl-none"
                )}
              >
                <p className="text-sm">{message.text}</p>
                <span className="text-xs opacity-70 block mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Chatbot input */}
        <form onSubmit={handleSendMessage} className="border-t border-hrm-light-gray p-2 flex">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 border-hrm-light-gray focus:border-hrm-steel-blue"
          />
          <Button type="submit" className="ml-2 bg-hrm-dark-cyan hover:bg-hrm-steel-blue">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
};

export default Chatbot;
