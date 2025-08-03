'use client';

import { useCallback, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { openaiKeyStorage } from '@/lib/openai-key';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useLanguagePreferences } from '@/hooks/use-language-preferences';

type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { inputLanguage, searchLanguage, isLoaded } = useLanguagePreferences();

  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>('ready');

  const sendMessage = useCallback(
    async (message: ChatMessage) => {
      // Read language preferences fresh from localStorage to avoid stale state
      const currentInputLanguage =
        localStorage.getItem('de-babel-input-language') || 'en';
      const currentSearchLanguage =
        localStorage.getItem('de-babel-search-language') || 'en';

      setStatus('submitted');
      const newMessages = [...messages, message];
      setMessages(newMessages);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': openaiKeyStorage.get() || '',
          },
          body: JSON.stringify({
            id,
            message,
            selectedChatModel: initialChatModel,
            selectedVisibilityType: visibilityType,
            inputLanguage: currentInputLanguage,
            searchLanguage: currentSearchLanguage,
          }),
        });
        if (!response.body) {
          setStatus('error');
          return;
        }

        setStatus('streaming');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let fullResponse = '';

        const assistantMessage: ChatMessage = {
          id: generateUUID(),
          role: 'assistant',
          parts: [{ type: 'text', text: '' }],
        };

        setMessages((prev) => [...prev, assistantMessage]);

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, parts: [{ type: 'text', text: fullResponse }] }
                : m,
            ),
          );
        }

        mutate(unstable_serialize(getChatHistoryPaginationKey));
        setStatus('ready');
      } catch (error) {
        setStatus('error');
      }
    },
    [id, initialChatModel, visibilityType, messages, mutate],
  );

  // Intercept messages to handle API key validation when no key exists
  const interceptedSendMessage = useCallback(
    (message: any, options?: any) => {
      // Ensure the message has an ID before sending
      const messageWithId: ChatMessage = {
        id: message.id || generateUUID(), // Generate ID if missing
        role: message.role || 'user', // Default role to 'user' if missing
        parts: message.parts || [{ type: 'text', text: message.text || '' }], // Ensure parts exist
        // Copy other properties if they exist
        ...(message.data && { data: message.data }),
        ...(message.ui && { ui: message.ui }),
        ...(message.display && { display: message.display }),
      };

      // If API key exists, send normally
      if (openaiKeyStorage.exists()) {
        return sendMessage(messageWithId);
      }

      // Extract text from message
      const getText = (msg: any): string => {
        if (typeof msg === 'string') return msg;
        if (msg.text) return msg.text;
        if (msg.content) return msg.content;
        if (msg.parts) {
          const textPart = msg.parts.find((part: any) => part.type === 'text');
          return textPart?.text || '';
        }
        return '';
      };

      const textContent = getText(message);

      // Add user message to chat
      const userMessage = {
        id: generateUUID(),
        role: 'user' as const,
        parts: message.parts || [{ type: 'text' as const, text: textContent }],
      };
      setMessages((prev) => [...prev, userMessage]);

      // Check for API key in message
      const apiKeyMatch = textContent.match(/sk-[a-zA-Z0-9_-]+/);

      setTimeout(() => {
        let responseText: string;

        if (apiKeyMatch && openaiKeyStorage.isValidFormat(apiKeyMatch[0])) {
          // Valid API key found - store it
          openaiKeyStorage.set(apiKeyMatch[0]);
          responseText =
            'Great! Your API key has been set successfully. You can now use all chat features. How can I help you today?';
        } else if (apiKeyMatch) {
          // Invalid API key format
          responseText =
            'I found what looks like an API key, but it appears to be invalid. Please make sure it starts with "sk-" and contains only letters, numbers, hyphens, and underscores.';
        } else {
          // No API key found
          responseText =
            'I need your OpenAI API key to respond. Please paste your API key (it should start with "sk-") in any message.';
        }

        // Add assistant response
        setMessages((prev) => [
          ...prev,
          {
            id: generateUUID(),
            role: 'assistant' as const,
            parts: [{ type: 'text' as const, text: responseText }],
          },
        ]);
      }, 500);

      return Promise.resolve();
    },
    [sendMessage, setMessages],
  );

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        id: generateUUID(),
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const handleArtifactSendMessage = async (message: any) => {
    const newMessage: ChatMessage = {
      id: message.id || generateUUID(),
      role: message.role || 'user',
      parts: message.parts,
    };
    await sendMessage(newMessage);
  };

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
          hasMessages={messages.length > 0}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          regenerate={async () => {}}
          sendMessage={interceptedSendMessage}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              status={status}
              stop={async () => {}}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              sendMessage={interceptedSendMessage}
              selectedVisibilityType={visibilityType}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={async () => {}}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={handleArtifactSendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={async () => {}}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
