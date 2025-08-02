'use client';

import { useState, useEffect } from 'react';
import {
  DEFAULT_INPUT_LANGUAGE,
  DEFAULT_SEARCH_LANGUAGE,
} from '@/lib/languages';

const INPUT_LANGUAGE_KEY = 'de-babel-input-language';
const SEARCH_LANGUAGE_KEY = 'de-babel-search-language';

export interface LanguagePreferences {
  inputLanguage: string;
  searchLanguage: string;
}

export function useLanguagePreferences() {
  const [inputLanguage, setInputLanguage] = useState(DEFAULT_INPUT_LANGUAGE);
  const [searchLanguage, setSearchLanguage] = useState(DEFAULT_SEARCH_LANGUAGE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    console.log('🔧 [Language Hook] Loading preferences from localStorage...');
    const savedInputLanguage = localStorage.getItem(INPUT_LANGUAGE_KEY);
    const savedSearchLanguage = localStorage.getItem(SEARCH_LANGUAGE_KEY);

    console.log('🔧 [Language Hook] Found saved preferences:', {
      savedInputLanguage,
      savedSearchLanguage,
    });

    if (savedInputLanguage) {
      setInputLanguage(savedInputLanguage);
    }
    if (savedSearchLanguage) {
      setSearchLanguage(savedSearchLanguage);
    }

    setIsLoaded(true);
    console.log('🔧 [Language Hook] Preferences loaded, final values:', {
      inputLanguage: savedInputLanguage || DEFAULT_INPUT_LANGUAGE,
      searchLanguage: savedSearchLanguage || DEFAULT_SEARCH_LANGUAGE,
      isLoaded: true,
    });
  }, []);

  const updateInputLanguage = (language: string) => {
    console.log('🔧 [Language Hook] Updating input language:', language);
    setInputLanguage(language);
    localStorage.setItem(INPUT_LANGUAGE_KEY, language);
  };

  const updateSearchLanguage = (language: string) => {
    console.log('🔧 [Language Hook] Updating search language:', language);
    setSearchLanguage(language);
    localStorage.setItem(SEARCH_LANGUAGE_KEY, language);
  };

  const updateLanguages = (preferences: LanguagePreferences) => {
    updateInputLanguage(preferences.inputLanguage);
    updateSearchLanguage(preferences.searchLanguage);
  };

  return {
    inputLanguage,
    searchLanguage,
    isLoaded,
    updateInputLanguage,
    updateSearchLanguage,
    updateLanguages,
  };
}
