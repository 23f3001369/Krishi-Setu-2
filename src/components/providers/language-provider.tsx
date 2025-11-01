
"use client"

import * as React from "react"

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import pa from '@/locales/pa.json';

type Language = "en" | "hi" | "pa"
type Translations = Record<string, string>;

const translations: Record<Language, Translations> = { en, hi, pa };

type LanguageProviderProps = {
  children: React.ReactNode
  defaultLanguage?: Language
  storageKey?: string
}

type LanguageProviderState = {
  language: Language
  setLanguage: (language: Language) => void
  translations: Translations
}

const initialState: LanguageProviderState = {
  language: "en",
  setLanguage: () => null,
  translations: translations.en,
}

const LanguageProviderContext = React.createContext<LanguageProviderState>(initialState)

export function LanguageProvider({
  children,
  defaultLanguage = "en",
  storageKey = "krishi-setu-lang",
  ...props
}: LanguageProviderProps) {
  const [language, setLanguage] = React.useState<Language>(defaultLanguage);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
      setIsMounted(true);
      const storedLang = localStorage.getItem(storageKey) as Language | null;
      if (storedLang && Object.keys(translations).includes(storedLang)) {
          setLanguage(storedLang);
      }
  }, [storageKey]);

  const setLanguageWrapper = (lang: Language) => {
    localStorage.setItem(storageKey, lang)
    setLanguage(lang)
  };

  React.useEffect(() => {
    if (isMounted) {
        document.documentElement.setAttribute("lang", language);
    }
  }, [language, isMounted]);

  const value = {
    language,
    setLanguage: setLanguageWrapper,
    translations: translations[language] || translations.en
  }

  if (!isMounted) {
    return null;
  }

  return (
    <LanguageProviderContext.Provider {...props} value={value}>
      {children}
    </LanguageProviderContext.Provider>
  )
}

export const useLanguage = () => {
  const context = React.useContext(LanguageProviderContext)

  if (context === undefined)
    throw new Error("useLanguage must be used within a LanguageProvider")

  return context
}
