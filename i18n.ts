import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import arTranslations from './locales/ar.json';
import frTranslations from './locales/fr.json';

const applyLangAttributes = (lng: string) => {
  const isRTL = lng === 'ar';
  document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  document.documentElement.setAttribute('data-lang', lng);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: arTranslations },
      fr: { translation: frTranslations },
    },
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'fr'],
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    },
  });

// Apply direction on every language change (including on first load)
i18n.on('languageChanged', applyLangAttributes);
// Apply once immediately for the detected language
applyLangAttributes(i18n.language || 'ar');

(window as any).__i18n = i18n;

export default i18n;
