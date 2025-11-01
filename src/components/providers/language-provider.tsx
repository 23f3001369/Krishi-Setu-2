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
  const [language, setLanguage] = React.useState<Language>(() => {
    if (typeof window === 'undefined') {
      return defaultLanguage;
    }
    return (localStorage.getItem(storageKey) as Language) || defaultLanguage
  })

  React.useEffect(() => {
    const root = window.document.documentElement
    root.setAttribute("lang", language)
  }, [language])

  const value = {
    language,
    setLanguage: (lang: Language) => {
      localStorage.setItem(storageKey, lang)
      setLanguage(lang)
    },
    translations: translations[language] || translations.en
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
