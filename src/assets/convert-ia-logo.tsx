
import React from 'react';

export const ConvertIALogo = ({ className = "" }: { className?: string }) => (
  <svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="40" height="40" x="5" y="5" rx="5" fill="#075985" />
    <text x="10" y="32" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="white">C-IA</text>
    <text x="50" y="20" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="#075985">CONVERT-IA</text>
    <text x="50" y="35" fontFamily="Arial" fontSize="10" fill="#075985">RECLUTAMIENTO</text>
  </svg>
);

export default ConvertIALogo;
