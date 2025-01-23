import { openai } from '@ai-sdk/openai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';

// Initialize DeepSeek client
const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
});

export const customModel = (apiIdentifier: string) => {
  // Use appropriate provider based on model identifier
  const model = apiIdentifier.startsWith('deepseek-')
    ? deepseek(apiIdentifier)
    : openai(apiIdentifier);

  return wrapLanguageModel({
    model,
    middleware: customMiddleware,
  });
};

export const imageGenerationModel = openai.image('dall-e-3');
