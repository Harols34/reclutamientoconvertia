
import React from 'react';

export const ConvertIALogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center ${className}`}>
    <img 
      src="/lovable-uploads/2a5b9f04-8bca-42bb-b866-ba02ca373974.png" 
      alt="Convert-IA Logo" 
      className="h-8 w-8" 
    />
    <span className="ml-2 font-bold text-lg text-white">CONVERT-IA</span>
  </div>
);

export default ConvertIALogo;
