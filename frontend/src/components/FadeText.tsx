import React from 'react';

interface FadeTextProps {
  text: string;
  className?: string;
}

export const FadeText: React.FC<FadeTextProps> = ({ text, className = '' }) => {
  return (
    <span key={text} className={`${className} animate-fade-in`}>
      {text}
    </span>
  );
};