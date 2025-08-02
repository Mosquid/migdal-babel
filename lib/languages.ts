export interface Language {
  code: string;
  name: string;
  countryCode: string; // ISO 3166-1 alpha-2 country code for flag
  nativeName: string;
}

// Top 20 most used languages + Serbian with their corresponding country flags
export const SUPPORTED_LANGUAGES: Language[] = [
  // English
  { code: 'en', name: 'English', countryCode: 'US', nativeName: 'English' },

  // Chinese (Mandarin)
  { code: 'zh', name: 'Chinese', countryCode: 'CN', nativeName: '中文' },

  // Spanish
  { code: 'es', name: 'Spanish', countryCode: 'ES', nativeName: 'Español' },

  // Hindi
  { code: 'hi', name: 'Hindi', countryCode: 'IN', nativeName: 'हिन्दी' },

  // Portuguese
  {
    code: 'pt',
    name: 'Portuguese',
    countryCode: 'BR',
    nativeName: 'Português',
  },

  // Russian
  { code: 'ru', name: 'Russian', countryCode: 'RU', nativeName: 'Русский' },

  // Japanese
  { code: 'ja', name: 'Japanese', countryCode: 'JP', nativeName: '日本語' },

  // German
  { code: 'de', name: 'German', countryCode: 'DE', nativeName: 'Deutsch' },

  // Korean
  { code: 'ko', name: 'Korean', countryCode: 'KR', nativeName: '한국어' },

  // French
  { code: 'fr', name: 'French', countryCode: 'FR', nativeName: 'Français' },

  // Turkish
  { code: 'tr', name: 'Turkish', countryCode: 'TR', nativeName: 'Türkçe' },

  // Vietnamese
  {
    code: 'vi',
    name: 'Vietnamese',
    countryCode: 'VN',
    nativeName: 'Tiếng Việt',
  },

  // Italian
  { code: 'it', name: 'Italian', countryCode: 'IT', nativeName: 'Italiano' },

  // Arabic
  { code: 'ar', name: 'Arabic', countryCode: 'SA', nativeName: 'العربية' },

  // Polish
  { code: 'pl', name: 'Polish', countryCode: 'PL', nativeName: 'Polski' },

  // Dutch
  { code: 'nl', name: 'Dutch', countryCode: 'NL', nativeName: 'Nederlands' },

  // Thai
  { code: 'th', name: 'Thai', countryCode: 'TH', nativeName: 'ไทย' },

  // Indonesian
  {
    code: 'id',
    name: 'Indonesian',
    countryCode: 'ID',
    nativeName: 'Bahasa Indonesia',
  },

  // Ukrainian
  {
    code: 'uk',
    name: 'Ukrainian',
    countryCode: 'UA',
    nativeName: 'Українська',
  },

  // Hebrew
  { code: 'he', name: 'Hebrew', countryCode: 'IL', nativeName: 'עברית' },

  // Serbian (as requested)
  { code: 'sr', name: 'Serbian', countryCode: 'RS', nativeName: 'Српски' },
];

export const DEFAULT_INPUT_LANGUAGE = 'en';
export const DEFAULT_SEARCH_LANGUAGE = 'en';

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

export function getLanguageName(code: string): string {
  const language = getLanguageByCode(code);
  return language ? language.name : code;
}

export function getLanguageNativeName(code: string): string {
  const language = getLanguageByCode(code);
  return language ? language.nativeName : code;
}
