import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, SUPPORTED_LANGUAGES } from '../translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    // 1. Initialize language from localStorage or default to English ('en')
    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem('preferred_language') || localStorage.getItem('default_system_language');
        return (saved && ['en', 'ta', 'hi', 'te'].includes(saved)) ? saved : 'en';
    });

    // 2. Sync with backend system settings on initial mount
    useEffect(() => {
        const syncSettings = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/settings/get').catch(() => null);
                if (res && res.ok) {
                    const data = await res.json();
                    if (data && data.default_language && ['en', 'ta', 'hi', 'te'].includes(data.default_language)) {
                        const localPref = localStorage.getItem('preferred_language');
                        if (!localPref) {
                            setLanguageState(data.default_language);
                            localStorage.setItem('default_system_language', data.default_language);
                        }
                    }
                }
            } catch (e) {}
        };
        syncSettings();
    }, []);

    // 3. Update document language tag and broadcast whenever language changes
    useEffect(() => {
        document.documentElement.lang = language;
        localStorage.setItem('preferred_language', language);
        localStorage.setItem('default_system_language', language);

        // Notify other components if needed
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
    }, [language]);

    // 4. Change language function
    const setLanguage = (langCode) => {
        if (['en', 'ta', 'hi', 'te'].includes(langCode)) {
            setLanguageState(langCode);
            localStorage.setItem('preferred_language', langCode);
            localStorage.setItem('default_system_language', langCode);
        }
    };

    // 5. Translation lookup helper `t('home.heroTitle', 'Find Your')`
    const t = (keyPath, fallback = '') => {
        if (!keyPath) return fallback;
        const keys = keyPath.split('.');
        
        // Try active language first
        let current = translations[language];
        for (const k of keys) {
            if (current && current[k] !== undefined) {
                current = current[k];
            } else {
                current = undefined;
                break;
            }
        }

        if (current !== undefined && typeof current === 'string') {
            return current;
        }

        // Fallback to English if translation is missing in active language
        let fallbackVal = translations['en'];
        for (const k of keys) {
            if (fallbackVal && fallbackVal[k] !== undefined) {
                fallbackVal = fallbackVal[k];
            } else {
                fallbackVal = undefined;
                break;
            }
        }

        return (fallbackVal !== undefined && typeof fallbackVal === 'string') ? fallbackVal : (fallback || keyPath);
    };

    const currentLanguageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

    const value = {
        language,
        setLanguage,
        t,
        currentLanguageInfo,
        supportedLanguages: SUPPORTED_LANGUAGES
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        // Fallback safe mock if accessed outside provider
        return {
            language: 'en',
            setLanguage: () => {},
            t: (key, fallback) => fallback || key,
            currentLanguageInfo: { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇬🇧' },
            supportedLanguages: SUPPORTED_LANGUAGES
        };
    }
    return context;
}
