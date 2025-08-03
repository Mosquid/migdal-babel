'use client';

import React from 'react';
import { Check, Globe } from 'lucide-react';
import getUnicodeFlagIcon from 'country-flag-icons/unicode';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SUPPORTED_LANGUAGES,
  getLanguageByCode,
  type Language,
} from '@/lib/languages';
import { useLanguagePreferences } from '@/hooks/use-language-preferences';

// Simple flag component using country-flag-icons unicode function
function CountryFlag({
  countryCode,
  className,
}: { countryCode: string; className?: string }) {
  const flagIcon = getUnicodeFlagIcon(countryCode);

  if (!flagIcon) {
    return <Globe size={16} className={className} />;
  }

  return (
    <span className={`text-sm ${className}`} style={{ lineHeight: 1 }}>
      {flagIcon}
    </span>
  );
}

interface LanguageSelectorProps {
  type: 'input' | 'search';
  variant?: 'default' | 'compact';
  className?: string;
}

export function LanguageSelector({
  type,
  variant = 'default',
  className,
}: LanguageSelectorProps) {
  const {
    inputLanguage,
    searchLanguage,
    updateInputLanguage,
    updateSearchLanguage,
    isLoaded,
  } = useLanguagePreferences();

  const currentLanguage = type === 'input' ? inputLanguage : searchLanguage;
  const updateLanguage =
    type === 'input' ? updateInputLanguage : updateSearchLanguage;
  const selectedLanguage = getLanguageByCode(currentLanguage);

  if (!isLoaded) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Globe size={16} />
        {variant === 'default' && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  const getLanguageLabel = (language: Language) => {
    if (variant === 'compact') {
      return language.code.toUpperCase();
    }
    return `${language.name} (${language.nativeName})`;
  };

  const getButtonLabel = () => {
    if (!selectedLanguage) return 'Select Language';

    if (variant === 'compact') {
      return selectedLanguage.code.toUpperCase();
    }

    return `${selectedLanguage.name}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${className} ${variant === 'compact' ? 'w-30 px-2' : 'min-w-[140px]'}`}
        >
          {selectedLanguage && (
            <CountryFlag
              countryCode={selectedLanguage.countryCode}
              className="mr-2 shrink-0"
            />
          )}
          {!selectedLanguage && <Globe size={16} className="mr-2" />}
          <span className="truncate">{getButtonLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 max-h-96 overflow-y-auto"
      >
        <DropdownMenuLabel>
          {type === 'input' ? 'Your Language' : 'Search Language'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => {
              console.log('🔧 [Language Selector] Language selected:', {
                type,
                oldLanguage: currentLanguage,
                newLanguage: language.code,
              });
              updateLanguage(language.code);
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center">
              <CountryFlag
                countryCode={language.countryCode}
                className="mr-3 shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{language.name}</span>
                <span className="text-xs text-muted-foreground">
                  {language.nativeName}
                </span>
              </div>
            </div>
            {currentLanguage === language.code && (
              <Check size={16} className="text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
