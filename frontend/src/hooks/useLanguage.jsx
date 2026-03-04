import { createContext, useContext, useState, useCallback } from 'react';
import { translate, DEFAULT_LANG } from '../data/i18n';
import { authApi } from '../lib/api';

const LanguageContext = createContext(null);

export function LanguageProvider({ children, initialLang }) {
  const [lang, setLangState] = useState(() => {
    // Priorité : param > localStorage > navigateur > défaut
    if (initialLang) return initialLang;
    const stored = localStorage.getItem('lang');
    if (stored) return stored;
    const nav = navigator.language || navigator.userLanguage || '';
    if (nav.startsWith('fr')) return 'fr-fr';
    if (nav.startsWith('en-GB')) return 'en-gb';
    if (nav.startsWith('en-CA')) return 'en-ca';
    if (nav.startsWith('en')) return 'en-us';
    return DEFAULT_LANG;
  });

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  const setLangAndSave = useCallback(async (newLang) => {
    setLang(newLang);
    try {
      await authApi.setLanguage(newLang);
    } catch (e) {
      // silencieux — la langue est déjà changée localement
    }
  }, [setLang]);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, setLangAndSave, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
