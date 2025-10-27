import { vi } from './vi';
import { en } from './en';

export type Language = 'vi' | 'en';

export type TranslationKey = keyof typeof vi;

export const translations = {
  vi,
  en,
} as const;

export function getTranslation(language: Language): typeof vi {
  return translations[language];
}
