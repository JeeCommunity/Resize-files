import React, { createContext, useContext } from 'react';
import { SupportedLanguage, getTranslation } from './translations';

interface LanguageContextType {
  lang: SupportedLanguage;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  t: (key) => key
});

export const LanguageProvider: React.FC<{
  lang: SupportedLanguage;
  children: React.ReactNode;
}> = ({ lang, children }) => {
  const t = (key: string) => getTranslation(lang, key);
  return (
    <LanguageContext.Provider value={{ lang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
