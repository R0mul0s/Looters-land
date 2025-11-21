/**
 * Internationalization System
 *
 * Core localization system for Looters Land.
 * Provides type-safe translation functions and language switching.
 *
 * Usage:
 * ```typescript
 * import { t, setLanguage, getLanguage } from './localization/i18n';
 *
 * // Get translated string
 * const title = t('app.title'); // 'Looters Land'
 *
 * // With nested keys
 * const warrior = t('heroClasses.warrior'); // 'Warrior' or 'Válečník'
 *
 * // Change language
 * setLanguage('cs'); // Switch to Czech
 * setLanguage('en'); // Switch to English
 *
 * // Get current language
 * const currentLang = getLanguage(); // 'en' or 'cs'
 * ```
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-01-07
 */

import { en } from './locales/en';
import { cs } from './locales/cs';
import type { LocaleKeys } from './locales/en';

// ============================================================================
// TYPES
// ============================================================================

export type Language = 'en' | 'cs';
export type TranslationKey = string;

// Type for accessing nested translation keys
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TKey = NestedKeyOf<LocaleKeys>;

// ============================================================================
// STATE
// ============================================================================

const locales: Record<Language, LocaleKeys> = {
  en,
  cs,
};

let currentLanguage: Language = 'en';

// Try to detect browser language on initialization
const browserLang = navigator.language.split('-')[0];
if (browserLang === 'cs') {
  currentLanguage = 'cs';
}

// Load saved language preference from localStorage
const savedLanguage = localStorage.getItem('game-language') as Language | null;
if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'cs')) {
  currentLanguage = savedLanguage;
}

// ============================================================================
// TRANSLATION FUNCTION
// ============================================================================

/**
 * Get translated string by key
 *
 * @param key - Dot-notation path to translation (e.g., 'app.title')
 * @param replacements - Optional object with values to replace in string (e.g., {name: 'Hero'})
 * @returns Translated string
 *
 * @example
 * ```typescript
 * // Simple translation
 * t('app.title') // 'Looters Land'
 *
 * // With replacements
 * t('combat.attacks', { attacker: 'Warrior', target: 'Goblin', damage: '50' })
 * // 'Warrior attacks Goblin for 50 damage'
 * ```
 */
export function t(key: string, replacements?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: unknown = locales[currentLanguage];

  // Navigate through nested object
  for (const k of keys) {
    if (value && typeof value === 'object' && !Array.isArray(value) && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key; // Return key as fallback
    }
  }

  // If value is not a string, return the key
  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key}`);
    return key;
  }

  // Replace placeholders if provided
  if (replacements) {
    return value.replace(/\{(\w+)\}/g, (match, placeholder) => {
      return placeholder in replacements ? String(replacements[placeholder]) : match;
    });
  }

  return value;
}

// ============================================================================
// LANGUAGE MANAGEMENT
// ============================================================================

/**
 * Set the current language
 *
 * @param lang - Language code ('en' or 'cs')
 *
 * @example
 * ```typescript
 * setLanguage('cs'); // Switch to Czech
 * setLanguage('en'); // Switch to English
 * ```
 */
export function setLanguage(lang: Language): void {
  if (lang in locales) {
    currentLanguage = lang;
    localStorage.setItem('game-language', lang);

    // Dispatch event for React components to re-render
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  } else {
    console.error(`Language not supported: ${lang}`);
  }
}

/**
 * Get the current language
 *
 * @returns Current language code ('en' or 'cs')
 *
 * @example
 * ```typescript
 * const lang = getLanguage(); // 'en' or 'cs'
 * ```
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Get list of available languages
 *
 * @returns Array of available language codes
 *
 * @example
 * ```typescript
 * const languages = getAvailableLanguages(); // ['en', 'cs']
 * ```
 */
export function getAvailableLanguages(): Language[] {
  return Object.keys(locales) as Language[];
}

// ============================================================================
// REACT HOOK (optional, for future use)
// ============================================================================

/**
 * Custom React hook for translations with automatic re-render on language change
 *
 * @returns Object with translation function and current language
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { t, language } = useTranslation();
 *   return <h1>{t('app.title')}</h1>;
 * }
 * ```
 */
export function useTranslation() {
  const [lang, setLang] = React.useState(currentLanguage);

  React.useEffect(() => {
    const handleLanguageChange = (e: CustomEvent) => {
      setLang(e.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  return {
    t,
    language: lang,
    setLanguage,
  };
}

// Note: Import React in components that use useTranslation hook
// The hook is included here for future reference but requires React import
import * as React from 'react';
