import type {
  CoreMessage,
  CoreSystemMessage,
  CoreUserMessage,
  CoreAssistantMessage,
  CoreToolMessage,
  TextPart,
  ImagePart,
  FilePart,
  ToolCallPart,
  ToolResultPart,
  AssistantContent,
  UserContent,
} from 'ai';

type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Format text part for database storage
 */
export function formatTextPart(part: TextPart): JsonObject {
  return {
    type: 'text',
    text: part.text,
    ...(part.experimental_providerMetadata && {
      experimental_providerMetadata: part.experimental_providerMetadata,
    }),
  };
}

/**
 * Format image part for database storage
 */
export function formatImagePart(part: ImagePart): JsonObject {
  // Handle URL objects
  if (part.image instanceof URL) {
    return {
      type: 'image',
      image: part.image.toString(),
      ...(part.mimeType && { mimeType: part.mimeType }),
      ...(part.experimental_providerMetadata && {
        experimental_providerMetadata: part.experimental_providerMetadata,
      }),
    };
  }

  // Handle DataContent (string | Uint8Array | ArrayBuffer | Buffer)
  const imageData =
    typeof part.image === 'string'
      ? part.image // Already a base64 string
      : Buffer.from(
          part.image instanceof Uint8Array
            ? part.image
            : new Uint8Array(part.image as ArrayBuffer),
        ).toString('base64');

  return {
    type: 'image',
    image: imageData,
    ...(part.mimeType && { mimeType: part.mimeType }),
    ...(part.experimental_providerMetadata && {
      experimental_providerMetadata: part.experimental_providerMetadata,
    }),
  };
}

/**
 * Format file part for database storage
 */
export function formatFilePart(part: FilePart): JsonObject {
  const data =
    part.data instanceof URL
      ? part.data.toString()
      : part.data instanceof ArrayBuffer
        ? Buffer.from(part.data).toString('base64')
        : typeof part.data === 'string'
          ? part.data
          : JSON.stringify(part.data);

  return {
    type: 'file',
    data,
    mimeType: part.mimeType,
    ...(part.experimental_providerMetadata && {
      experimental_providerMetadata: part.experimental_providerMetadata,
    }),
  };
}

/**
 * Format tool call part for database storage
 */
export function formatToolCallPart(part: ToolCallPart): JsonObject {
  return {
    type: 'tool-call',
    toolCallId: part.toolCallId,
    toolName: part.toolName,
    toolArgs:
      typeof part.args === 'string' ? part.args : JSON.stringify(part.args),
    ...(part.experimental_providerMetadata && {
      experimental_providerMetadata: part.experimental_providerMetadata,
    }),
  };
}

/**
 * Format tool result part for database storage
 */
export function formatToolResultPart(part: ToolResultPart): JsonObject {
  return {
    type: 'tool-result',
    toolCallId: part.toolCallId,
    toolName: part.toolName,
    result:
      typeof part.result === 'string'
        ? part.result
        : JSON.stringify(part.result),
    ...(part.experimental_content && {
      experimental_content: part.experimental_content,
    }),
    ...(part.isError !== undefined && { isError: part.isError }),
    ...(part.experimental_providerMetadata && {
      experimental_providerMetadata: part.experimental_providerMetadata,
    }),
  };
}

/**
 * Format user content for database storage
 */
export function formatUserContent(content: UserContent): JsonValue {
  if (typeof content === 'string') {
    return content;
  }
  return content.map((part) => {
    switch (part.type) {
      case 'text':
        return formatTextPart(part);
      case 'image':
        return formatImagePart(part);
      case 'file':
        return formatFilePart(part);
      default:
        throw new Error(`Unknown content part type: ${(part as any).type}`);
    }
  });
}

/**
 * Format assistant content for database storage
 */
export function formatAssistantContent(content: AssistantContent): JsonValue {
  if (typeof content === 'string') {
    return content;
  }
  return content.map((part) => {
    switch (part.type) {
      case 'text':
        return formatTextPart(part);
      case 'tool-call':
        return formatToolCallPart(part);
      default:
        throw new Error(`Unknown content part type: ${(part as any).type}`);
    }
  });
}

/**
 * Format tool content for database storage
 */
export function formatToolContent(content: ToolResultPart[]): JsonValue {
  return content.map(formatToolResultPart);
}

/**
 * Format message content for database storage based on message role
 */
export function formatMessageContent(message: CoreMessage): JsonValue {
  switch (message.role) {
    case 'system':
      return (message as CoreSystemMessage).content;
    case 'user':
      return formatUserContent((message as CoreUserMessage).content);
    case 'assistant':
      return formatAssistantContent((message as CoreAssistantMessage).content);
    case 'tool':
      return formatToolContent((message as CoreToolMessage).content);
    default:
      throw new Error(`Unknown message role: ${(message as any).role}`);
  }
}
