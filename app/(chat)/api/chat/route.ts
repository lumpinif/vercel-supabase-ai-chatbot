import {
  convertToCoreMessages,
  createDataStreamResponse,
  type Message,
  smoothStream,
  streamText,
} from 'ai';

import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { createClient } from '@/utils/supabase/server';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/supabase/queries';
import {
  formatMessageContent,
  formatUserContent,
} from '@/lib/db/supabase/helpers';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];
const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();

  const supabase = await createClient();
  const { data: session, error } = await supabase.auth.getUser();

  if (!session || !session.user || !session.user.id || error) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  const userMessageId = generateUUID();

  await saveMessages({
    messages: [
      {
        ...userMessage,
        id: userMessageId,
        created_at: new Date().toISOString(),
        chat_id: id,
        user_id: session.user.id,
        content: formatUserContent(userMessage.content),
      },
    ],
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData({
        type: 'user-message-id',
        content: userMessageId,
      });

      const result = streamText({
        model: customModel(model.apiIdentifier),
        system: systemPrompt,
        messages: coreMessages,
        maxSteps: 5,
        experimental_activeTools: allTools,
        experimental_transform: smoothStream({ chunking: 'word' }),
        tools: {
          getWeather,
          createDocument: createDocument({
            user: session.user,
            dataStream,
            model,
          }),
          updateDocument: updateDocument({
            user: session.user,
            dataStream,
            model,
          }),
          requestSuggestions: requestSuggestions({
            user: session.user,
            dataStream,
            model,
          }),
        },
        onFinish: async ({ response }) => {
          if (session.user?.id) {
            try {
              const responseMessagesWithoutIncompleteToolCalls =
                sanitizeResponseMessages(response.messages);

              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    const messageId = generateUUID();

                    if (message.role === 'assistant') {
                      dataStream.writeMessageAnnotation({
                        messageIdFromServer: messageId,
                      });
                    }

                    return {
                      id: messageId,
                      chat_id: id,
                      role: message.role,
                      content: formatMessageContent(message),
                      created_at: new Date().toISOString(),
                      user_id: session.user.id,
                    };
                  },
                ),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase.auth.getUser();

  if (!session || !session.user || !session.user.id || error) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat?.user_id !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
