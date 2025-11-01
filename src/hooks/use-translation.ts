"use client";

import { useLanguage } from '@/components/providers/language-provider';

export function useTranslation() {
  const { translations, language } = useLanguage();

  const t = (key: string): string => {
    return translations[key] || key;
  };
  
  return { t, language, langName: language === 'hi' ? 'Hindi' : language === 'pa' ? 'Punjabi' : 'English' };
}
