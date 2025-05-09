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
  const processedMessageIds = useRef<Set<string>>(new Set());
  
  // Process messages to ensure uniqueness and proper ordering
  const processedMessages = useMemo(() => {
    // Ensure unique messages by ID
    const uniqueMessages = messages.filter(message => {
      const key = message.id;
      if (!key) return true; // Keep messages without ID (temporary)
      
      if (!processedMessageIds.current.has(key)) {
        processedMessageIds.current.add(key);
        return true;
      }
      return false;
    });
    
    // Sort messages by timestamp
    return [...uniqueMessages].sort((a, b) => {
      return new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime();
    });
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && processedMessages.length > previousMessagesCountRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      previousMessagesCountRef.current = processedMessages.length;
    }
  }, [processedMessages]);
  
  // Debug: Log message processing
  useEffect(() => {
    console.log('Messages in MessageList:', processedMessages.length);
    console.log('AI messages count:', processedMessages.filter(m => m.sender_type === 'ai').length);
    console.log('Candidate messages count:', processedMessages.filter(m => m.sender_type === 'candidate').length);
    
    if (processedMessages.length !== messages.length) {
      console.log('Filtered out', messages.length - processedMessages.length, 'duplicate messages');
    }
  }, [messages, processedMessages]);

  return (
    <div className="flex flex-col space-y-4 w-full">
      {processedMessages.length === 0 ? (
        <div className="text-center py-8 text-gray-500 italic">
          Inicia la conversación enviando un mensaje...
        </div>
      ) : (
        processedMessages.map((msg, index) => (
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
