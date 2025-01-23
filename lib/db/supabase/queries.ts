import 'server-only';
import { createClient } from '@/utils/supabase/server';
import type { BlockKind, Message, Suggestion, VisibilityType } from '../types';

// User queries
export async function getUserProfile(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profile')
    .select()
    .eq('email', email);

  if (error) throw error;
  return data;
}

// Chat queries
export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('chat').insert({
    id,
    user_id: userId,
    title,
  });

  if (error) throw error;
}

export async function deleteChatById({ id }: { id: string }) {
  const supabase = await createClient();

  // Delete related votes first
  await supabase.from('vote').delete().eq('chat_id', id);

  // Delete related messages
  await supabase.from('message').delete().eq('chat_id', id);

  // Delete the chat
  const { error } = await supabase.from('chat').delete().eq('id', id);

  if (error) throw error;
}

export async function getChatsByUserId({ id }: { id: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat')
    .select()
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getChatById({ id }: { id: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat')
    .select()
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Message queries
export async function saveMessages({
  messages,
}: { messages: Array<Omit<Message, 'updated_at' | 'tokens'>> }) {
  const supabase = await createClient();
  const { error } = await supabase.from('message').insert(messages);

  if (error) throw error;
}

export async function getMessagesByChatId({ id }: { id: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('message')
    .select()
    .eq('chat_id', id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getMessageById({ id }: { id: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('message')
    .select()
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Vote queries
export async function voteMessage({
  chat_id,
  message_id,
  type,
}: {
  chat_id: string;
  message_id: string;
  type: 'up' | 'down';
}) {
  const supabase = await createClient();

  // Check for existing vote
  const { data: existingVote } = await supabase
    .from('vote')
    .select()
    .eq('message_id', message_id)
    .maybeSingle();

  if (existingVote) {
    const { error } = await supabase
      .from('vote')
      .update({ is_upvoted: type === 'up' })
      .eq('message_id', message_id)
      .eq('chat_id', chat_id);

    if (error) throw error;
  } else {
    const { error } = await supabase.from('vote').insert({
      chat_id: chat_id,
      message_id: message_id,
      is_upvoted: type === 'up',
    });

    if (error) throw error;
  }
}

export async function getVotesByChatId({
  chat_id,
}: {
  chat_id: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vote')
    .select()
    .eq('chat_id', chat_id);

  if (error) throw error;
  return data;
}

// Document queries
export async function saveDocument({
  id,
  title,
  kind,
  content,
  user_id,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  user_id: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('document').insert({
    id,
    title,
    kind,
    content,
    user_id,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function getDocumentsById({ id }: { id: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document')
    .select()
    .eq('id', id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getDocumentById({ id }: { id: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document')
    .select()
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('document')
    .delete()
    .eq('id', id)
    .gt('created_at', timestamp.toISOString());

  if (error) throw error;
}

// Suggestion queries
export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('suggestion').insert(suggestions);

  if (error) throw error;
}

export async function getSuggestionsByDocumentId({
  document_id,
}: {
  document_id: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('suggestion')
    .select()
    .eq('document_id', document_id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chat_id,
  timestamp,
}: {
  chat_id: string;
  timestamp: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('message')
    .delete()
    .eq('chat_id', chat_id)
    .gt('created_at', timestamp);

  if (error) throw error;
}

export async function updateChatVisiblityById({
  id: chatId,
  visibility,
}: {
  id: string;
  visibility: VisibilityType;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('chat')
    .update({ visibility })
    .eq('id', chatId);

  if (error) throw error;
}
