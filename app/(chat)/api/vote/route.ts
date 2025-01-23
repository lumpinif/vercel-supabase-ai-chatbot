import { getVotesByChatId, voteMessage } from '@/lib/db/supabase/queries';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase.auth.getUser();

  if (!session || !session.user || !session.user.email || error) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const votes = await getVotesByChatId({ chat_id: chatId });
    return Response.json(votes || [], { status: 200 });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return Response.json([], { status: 200 });
  }
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: 'up' | 'down' } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new Response('messageId and type are required', { status: 400 });
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase.auth.getUser();

  if (!session || !session.user || !session.user.email || error) {
    return new Response('Unauthorized', { status: 401 });
  }

  await voteMessage({
    chat_id: chatId,
    message_id: messageId,
    type: type,
  });

  return new Response('Message voted', { status: 200 });
}
