
import React, { useEffect, useRef } from 'react';

interface Message {
  id: string;
  sender_type: 'ai' | 'candidate';
  content: string;
  sent_at: string;
}

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Debug: Log messages when they change
  useEffect(() => {
    console.log('Messages in MessageList:', messages);
  }, [messages]);

  return (
    <div className="flex flex-col space-y-4 w-full">
      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500 italic">
          Inicia la conversación enviando un mensaje...
        </div>
      ) : (
        messages.map((msg, index) => (
          <div
            key={msg.id || `message-${index}-${Date.now()}`}
            className={`mb-4 flex ${msg.sender_type === 'candidate' ? 'justify-end' : 'justify-start'}`}
            data-testid={`message-${msg.sender_type}-${index}`}
          >
            <div
              className={`rounded-lg p-3 max-w-[80%] ${
                msg.sender_type === 'candidate'
                  ? 'bg-hrm-steel-blue text-white'
                  : 'bg-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div className="text-xs mt-1 opacity-70">
                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
