// ============================================================================
// EJLOG WMS - i18n Configuration
// Configurazione internazionalizzazione con i18next
// ============================================================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationIT from './locales/it/translation.json';
import translationEN from './locales/en/translation.json';

// Translation resources
const resources = {
  it: {
    translation: translationIT,
  },
  en: {
    translation: translationEN,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources,
    fallbackLng: 'it', // Italian as default language
    debug: import.meta.env.DEV, // Enable debug in development mode

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag'],

      // Cache user language
      caches: ['localStorage'],

      // localStorage key
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false, // Disable Suspense mode to avoid loading issues
    },
  });

export default i18n;
