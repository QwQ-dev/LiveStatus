import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  isTransitioning: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Auto-detect browser language
    if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('zh')) {
      return 'zh';
    }
    return 'en';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleLanguage = () => {
    setIsTransitioning(true);
    // Wait for fade out to complete (300ms), then switch language
    setTimeout(() => {
      setLanguage((prev) => (prev === 'en' ? 'zh' : 'en'));
      // Immediately start fading in
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  const value = {
    language,
    toggleLanguage,
    isTransitioning,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};