import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { getLanguageName } from '@/lib/languages';

interface TranslationOptions {
  text: string;
  fromLanguage: string;
  toLanguage: string;
  apiKey: string;
}

export async function streamTranslateText({
  text,
  fromLanguage,
  toLanguage,
  apiKey,
}: TranslationOptions) {
  // If languages are the same, no translation needed
  if (fromLanguage === toLanguage) {
    console.log('⏭️ [Translation] Skipping streaming translation - same language');
    // Return a stream that immediately outputs the original text
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(text);
        controller.close();
      },
    });
    return readableStream;
  }

  console.log('🔤 [Translation] Starting text streaming translation:', {
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    fromLanguage: getLanguageName(fromLanguage),
    toLanguage: getLanguageName(toLanguage),
    textLength: text.length,
  });

  const openaiProvider = createOpenAI({ apiKey });

  try {
    const { textStream } = await streamText({
      model: openaiProvider('gpt-4o-mini'),
      system: `You are a professional translator. Translate the given text from ${getLanguageName(
        fromLanguage,
      )} to ${getLanguageName(toLanguage)}.

      Rules:
      - Preserve the original meaning and context
      - Maintain the tone and style of the original text
      - Keep technical terms and proper nouns when appropriate
      - Return ONLY the translated text without any explanations or additional content
      - If the text is already in the target language, return it as is`,
      prompt: text,
    });

    console.log('✅ [Translation] Text streaming translation started');
    return textStream;
  } catch (error) {
    console.error('❌ [Translation] Streaming translation error:', error);
    console.log('🔄 [Translation] Falling back to original text stream');
    // Fallback: return a stream of the original text if translation fails
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(text);
        controller.close();
      },
    });
    return readableStream;
  }
}

export async function translateText({
  text,
  fromLanguage,
  toLanguage,
  apiKey,
}: TranslationOptions): Promise<string> {
  // If languages are the same, no translation needed
  if (fromLanguage === toLanguage) {
    console.log('⏭️ [Translation] Skipping translation - same language:', {
      fromLanguage,
      toLanguage,
    });
    return text;
  }

  console.log('🔤 [Translation] Starting text translation:', {
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    fromLanguage: getLanguageName(fromLanguage),
    toLanguage: getLanguageName(toLanguage),
    textLength: text.length,
  });

  const openaiProvider = createOpenAI({ apiKey });

  try {
    const { text: translatedText } = await generateText({
      model: openaiProvider('gpt-4o-mini'),
      system: `You are a professional translator. Translate the given text from ${getLanguageName(fromLanguage)} to ${getLanguageName(toLanguage)}. 
      
      Rules:
      - Preserve the original meaning and context
      - Maintain the tone and style of the original text
      - Keep technical terms and proper nouns when appropriate
      - Return ONLY the translated text without any explanations or additional content
      - If the text is already in the target language, return it as is`,
      prompt: text,
    });

    console.log('✅ [Translation] Text translation completed:', {
      originalLength: text.length,
      translatedLength: translatedText.trim().length,
      result:
        translatedText.trim().substring(0, 100) +
        (translatedText.trim().length > 100 ? '...' : ''),
    });

    return translatedText.trim();
  } catch (error) {
    console.error('❌ [Translation] Translation error:', error);
    console.log('🔄 [Translation] Falling back to original text');
    // Fallback: return original text if translation fails
    return text;
  }
}

export async function translateMessage(
  message: any,
  fromLanguage: string,
  toLanguage: string,
  apiKey: string,
) {
  if (fromLanguage === toLanguage) {
    console.log('⏭️ [Translation] Skipping message translation - same language');
    return message;
  }

  console.log('📨 [Translation] Starting message translation:', {
    messageId: message.id,
    role: message.role,
    fromLanguage: getLanguageName(fromLanguage),
    toLanguage: getLanguageName(toLanguage),
    partsCount: message.parts?.length || 0,
  });

  // Clone the message to avoid mutating the original
  const translatedMessage = { ...message };

  // Translate each text part in the message
  if (message.parts && Array.isArray(message.parts)) {
    translatedMessage.parts = await Promise.all(
      message.parts.map(async (part: any) => {
        if (part.type === 'text' && part.text) {
          console.log('📝 [Translation] Translating text part:', {
            originalText:
              part.text.substring(0, 50) + (part.text.length > 50 ? '...' : ''),
          });

          const translatedText = await translateText({
            text: part.text,
            fromLanguage,
            toLanguage,
            apiKey,
          });

          return {
            ...part,
            text: translatedText,
          };
        }
        return part; // Non-text parts remain unchanged
      }),
    );
  }

  console.log('✅ [Translation] Message translation completed:', {
    messageId: message.id,
    originalPartsCount: message.parts?.length || 0,
    translatedPartsCount: translatedMessage.parts?.length || 0,
  });

  return translatedMessage;
}
