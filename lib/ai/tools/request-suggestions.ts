import { z } from 'zod';
import type { Model } from '../models';
import { type DataStreamWriter, streamObject, tool } from 'ai';
import { customModel } from '..';
import { generateUUID } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import { getDocumentById, saveSuggestions } from '@/lib/db/supabase/queries';
import type { Suggestion } from '@/lib/db/types';

interface RequestSuggestionsProps {
  model: Model;
  user: User;
  dataStream: DataStreamWriter;
}

export const requestSuggestions = ({
  model,
  user,
  dataStream,
}: RequestSuggestionsProps) =>
  tool({
    description: 'Request suggestions for a document',
    parameters: z.object({
      document_id: z
        .string()
        .describe('The ID of the document to request edits'),
    }),
    execute: async ({ document_id }) => {
      const document = await getDocumentById({ id: document_id });

      if (!document || !document.content) {
        return {
          error: 'Document not found',
        };
      }

      const suggestions: Array<
        Omit<Suggestion, 'user_id' | 'created_at' | 'document_created_at'>
      > = [];

      const { elementStream } = streamObject({
        model: customModel(model.apiIdentifier),
        system:
          'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
        prompt: document.content,
        output: 'array',
        schema: z.object({
          originalSentence: z.string().describe('The original sentence'),
          suggestedSentence: z.string().describe('The suggested sentence'),
          description: z.string().describe('The description of the suggestion'),
        }),
      });

      for await (const element of elementStream) {
        const suggestion = {
          original_text: element.originalSentence,
          suggested_text: element.suggestedSentence,
          description: element.description,
          id: generateUUID(),
          document_id: document_id,
          is_resolved: false,
        };

        dataStream.writeData({
          type: 'suggestion',
          content: suggestion,
        });

        suggestions.push(suggestion);
      }

      if (user?.id) {
        const user_id = user?.id;

        await saveSuggestions({
          suggestions: suggestions.map((suggestion) => ({
            ...suggestion,
            user_id,
            created_at: new Date().toISOString(),
            document_created_at: document.created_at,
          })),
        });
      }

      return {
        id: document_id,
        title: document.title,
        kind: document.kind,
        message: 'Suggestions have been added to the document',
      };
    },
  });
