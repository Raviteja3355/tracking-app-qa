import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'

const locale =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/fr/')
    ? 'fr'
    : 'en'

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: locale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
}

export default i18n
