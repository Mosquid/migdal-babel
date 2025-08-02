import {
  convertToModelMessages,
  generateText,
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';
import { createOpenAI } from '@ai-sdk/openai';

import { streamTranslateText, translateMessage } from '@/lib/ai/translation';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    // Extract API key from headers
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
      inputLanguage = 'en',
      searchLanguage = 'en',
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
      inputLanguage?: string;
      searchLanguage?: string;
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
        apiKey,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    console.log('🌍 [De-Babel] Language Configuration:', {
      inputLanguage,
      searchLanguage,
      translationRequired: inputLanguage !== searchLanguage,
    });

    console.log('📝 [De-Babel] Original User Message:', {
      role: message.role,
      parts: message.parts,
      language: inputLanguage,
    });

    // Translate messages for processing if languages differ
    let processedMessages = uiMessages;
    if (inputLanguage !== searchLanguage) {
      console.log('🔄 [De-Babel] Translating messages to search language...');

      // Translate all messages to search language for AI processing
      processedMessages = await Promise.all(
        uiMessages.map(async (msg) => {
          if (msg.role === 'user') {
            const translatedMessage = await translateMessage(
              msg,
              inputLanguage,
              searchLanguage,
              apiKey,
            );

            console.log('🔄 [De-Babel] Message Translation:', {
              original: msg.parts,
              translated: translatedMessage.parts,
              from: inputLanguage,
              to: searchLanguage,
            });

            return translatedMessage;
          }
          return msg; // Keep assistant messages as-is
        }),
      );

      console.log('✅ [De-Babel] Translation to search language complete');
    } else {
      console.log('ℹ️ [De-Babel] No translation needed - same language');
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // Create custom provider with user's API key
    const openaiProvider = createOpenAI({ apiKey });
    const userProvider = customProvider({
      languageModels: {
        'chat-model': openaiProvider('gpt-4o'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openaiProvider('o3-mini'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openaiProvider('gpt-4o-mini'),
        'artifact-model': openaiProvider('gpt-4o-mini'),
      },
      imageModels: {
        'small-model': openaiProvider.imageModel('gpt-4o'),
      },
    });

    // Use completion API for all inference, then stream the (translated) response
    console.log('🔄 [De-Babel] Using completion API for inference...');

    // Get complete response using generateText
    const { text } = await generateText({
      model: userProvider.languageModel(selectedChatModel),
      system: systemPrompt({
        selectedChatModel,
        requestHints,
        inputLanguage,
        searchLanguage,
      }),
      messages: convertToModelMessages(processedMessages),
      tools: {
        getWeather,
        // Note: Document tools are not supported in completion API
      },
    });

    console.log('🤖 [De-Babel] AI Response Generated:', {
      text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      language: searchLanguage,
    });

    // Save the AI response
    const assistantMessage = {
      id: generateUUID(),
      role: 'assistant' as const,
      parts: [{ type: 'text' as const, text }],
      createdAt: new Date(),
      chatId: id,
      attachments: [],
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user' as const,
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
        assistantMessage,
      ],
    });

    // Stream the translated response if needed
    if (inputLanguage !== searchLanguage) {
      console.log(
        '🔄 [De-Babel] Translating and streaming AI response back to user language...',
      );

      const translationStream = await streamTranslateText({
        text,
        fromLanguage: searchLanguage,
        toLanguage: inputLanguage,
        apiKey,
      });

      return new Response(translationStream);
    } else {
      console.log(
        '✅ [De-Babel] No response translation needed - streaming original text',
      );
      // If no translation is needed, stream the original text directly
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(text);
          controller.close();
        },
      });
      return new Response(readableStream);
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Handle any other unexpected errors
    console.error('Unexpected error in chat API:', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
