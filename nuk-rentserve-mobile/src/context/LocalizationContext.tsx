// Localization Context for Bilingual English and Kannada

import React, { createContext, useContext, useEffect, useState } from 'react';
import { STRINGS, Language } from '../constants/strings';
import { Storage } from '../utils/storage';

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (keyOrEn: string, knFallback?: string) => string;
  isKannada: boolean;
}

const LocalizationContext = createContext<LocalizationContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (k) => k,
  isKannada: false,
});

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    (async () => {
      const saved = await Storage.getLanguage();
      if (saved) {
        setLanguageState(saved);
      }
    })();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    await Storage.setLanguage(newLang);
  };

  const t = (keyOrEn: string, knFallback?: string): string => {
    // 1. Check if key exists in dictionary
    const dict = STRINGS[language] as Record<string, string>;
    if (dict[keyOrEn]) {
      return dict[keyOrEn];
    }
    // 2. Direct inline fallback (en vs kn)
    if (knFallback !== undefined) {
      return language === 'kn' ? knFallback : keyOrEn;
    }
    return keyOrEn;
  };

  return (
    <LocalizationContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isKannada: language === 'kn',
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => useContext(LocalizationContext);
