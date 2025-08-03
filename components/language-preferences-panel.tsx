'use client';

import { LanguageSelector } from './language-selector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLanguagePreferences } from '@/hooks/use-language-preferences';
import { getLanguageByCode } from '@/lib/languages';

interface LanguagePreferencesPanelProps {
  variant?: 'default' | 'compact';
  className?: string;
  chatId?: string;
}

export function LanguagePreferencesPanel({
  variant = 'default',
  className,
  chatId,
}: LanguagePreferencesPanelProps) {
  const { inputLanguage, searchLanguage } = useLanguagePreferences();

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Input:</span>
          <LanguageSelector type="input" variant="compact" />
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Search:</span>
          <LanguageSelector type="search" variant="compact" />
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Language Settings</CardTitle>
        <CardDescription>
          Choose your input language and preferred search language for better
          results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Your Language</div>
          <p className="text-xs text-muted-foreground">
            The language you&apos;ll type your messages in
          </p>
          <LanguageSelector type="input" variant="default" />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Search Language</div>
          <p className="text-xs text-muted-foreground">
            The language used to search and research information (usually
            English for best results)
          </p>
          <LanguageSelector type="search" variant="default" />
        </div>

        {inputLanguage !== searchLanguage && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Translation active:</strong> Your messages will be
              translated from {getLanguageByCode(inputLanguage)?.name} to{' '}
              {getLanguageByCode(searchLanguage)?.name} for searching, and
              results will be translated back to{' '}
              {getLanguageByCode(inputLanguage)?.name}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
