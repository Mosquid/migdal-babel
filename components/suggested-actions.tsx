'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo, useState, useEffect } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/lib/types';
import { openaiKeyStorage } from '@/lib/openai-key';

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedVisibilityType: VisibilityType;
  setInput?: (input: string) => void;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
  setInput,
}: SuggestedActionsProps) {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    setHasApiKey(openaiKeyStorage.exists());
  }, []);

  const suggestedActions = hasApiKey
    ? []
    : [
        {
          title: 'Paste your OpenAI API key',
          label: 'in any message format',
          action: 'my openai api key is ',
        },
      ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();

              if (setInput) {
                // Set the text in the input field instead of sending
                setInput(suggestedAction.action);
              }
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
