import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../public/locales/en/common.json';
import ru from '../public/locales/ru/common.json';

const resources = {
    en: { common: en },
    ru: { common: ru },
};

const getLanguage = () => 'en';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getLanguage(),
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common'],
        interpolation: { escapeValue: false },
        react: {
            useSuspense: false,
        },
    });

export default i18n;