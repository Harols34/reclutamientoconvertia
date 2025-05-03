
import React from 'react';
import ChatbotInterface from './ChatbotInterface';

interface ChatbotProps {
  userType: 'public' | 'admin';
}

const Chatbot: React.FC<ChatbotProps> = ({ userType }) => {
  return (
    <ChatbotInterface userType={userType} />
  );
};

export default Chatbot;
