
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
const MessageBubble = memo(({ message, index }: { message: Message, index: number }) => {
  const formattedTime = useMemo(() => {
    return new Date(message.sent_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [message.sent_at]);

  return (
    <div
      className={`mb-4 flex ${message.sender_type === 'candidate' ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.sender_type}-${index}`}
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
  const previousMessagesCountRef = useRef<number>(0);
  
  // Unique messages based on ID to prevent duplicates
  const uniqueMessages = useMemo(() => {
    const seen = new Map();
    return messages.filter(message => {
      const key = message.id;
      if (!seen.has(key)) {
        seen.set(key, true);
        return true;
      }
      return false;
    });
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && uniqueMessages.length > previousMessagesCountRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      previousMessagesCountRef.current = uniqueMessages.length;
    }
  }, [uniqueMessages]);
  
  // Debug: Log messages when they change
  useEffect(() => {
    console.log('Messages in MessageList:', uniqueMessages.length);
    if (uniqueMessages.length !== messages.length) {
      console.log('Filtered out', messages.length - uniqueMessages.length, 'duplicate messages');
    }
  }, [messages, uniqueMessages]);

  return (
    <div className="flex flex-col space-y-4 w-full">
      {uniqueMessages.length === 0 ? (
        <div className="text-center py-8 text-gray-500 italic">
          Inicia la conversación enviando un mensaje...
        </div>
      ) : (
        uniqueMessages.map((msg, index) => (
          <MessageBubble 
            key={msg.id || `message-${index}-${Date.now()}`} 
            message={msg} 
            index={index}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
