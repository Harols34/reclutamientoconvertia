
import React, { useEffect, useRef, memo, useMemo } from 'react';

interface Message {
  id: string;
  sender_type: 'ai' | 'candidate';
  content: string;
  sent_at: string;
}

interface MessageListProps {
  messages: Message[];
}

// Create a memoized MessageBubble component to optimize rendering
const MessageBubble = memo(({ message }: { message: Message }) => {
  const formattedTime = useMemo(() => {
    return new Date(message.sent_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [message.sent_at]);

  return (
    <div
      className={`mb-4 flex ${message.sender_type === 'candidate' ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.sender_type}`}
      data-message-id={message.id}
    >
      <div
        className={`rounded-lg p-3 max-w-[80%] ${
          message.sender_type === 'candidate'
            ? 'bg-hrm-steel-blue text-white'
            : 'bg-gray-100'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div className="text-xs mt-1 opacity-70">
          {formattedTime}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Debug: Log message count
  useEffect(() => {
    console.log('Messages in MessageList:', messages.length);
    console.log('AI messages count:', messages.filter(m => m.sender_type === 'ai').length);
    console.log('Candidate messages count:', messages.filter(m => m.sender_type === 'candidate').length);
    
    if (messages.length > 0) {
      console.log('Last message:', {
        id: messages[messages.length - 1].id,
        type: messages[messages.length - 1].sender_type,
        content: messages[messages.length - 1].content.substring(0, 50) + (messages[messages.length - 1].content.length > 50 ? '...' : '')
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col space-y-2 w-full">
      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500 italic">
          Inicia la conversación enviando un mensaje...
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble 
            key={msg.id || `message-${Date.now()}-${Math.random()}`} 
            message={msg}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
