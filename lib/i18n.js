// lib/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../public/locales/en/common.json';
import ru from '../public/locales/ru/common.json';

const resources = {
    en: { common: en },
    ru: { common: ru },
};

const getLanguage = () => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('i18nextLng');
        if (saved && ['en', 'ru'].includes(saved)) return saved;
        const browserLang = navigator.language?.split('-')[0];
        if (['en', 'ru'].includes(browserLang)) return browserLang;
    }
    return 'en';
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getLanguage(),
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
    });

export default i18n;