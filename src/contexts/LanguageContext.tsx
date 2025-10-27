import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Language } from '../i18n';
import { translations, getTranslation } from '../i18n';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function detectDefaultLanguage(): Language {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('taskie_language');
    if (saved === 'vi' || saved === 'en') return saved;
  }

  // Detect from timezone
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Ho_Chi_Minh') || timezone.includes('Bangkok')) {
      return 'vi';
    }
  } catch (e) {
    console.warn('Failed to detect timezone:', e);
  }

  // Check browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('vi')) return 'vi';
    if (browserLang.startsWith('en')) return 'en';
  }

  // Default to Vietnamese
  return 'vi';
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => detectDefaultLanguage());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskie_language', language);
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      try {
        const translation = getTranslation(language);
        const keys = key.split('.');
        let value: any = translation;

        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) break;
        }

        return typeof value === 'string' ? value : key;
      } catch (error) {
        console.warn(`Translation not found for key: ${key}`);
        return key;
      }
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside a LanguageProvider');
  }
  return context;
}
