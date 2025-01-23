import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { createClient } from '@/utils/supabase/server';
import { getChatById, getMessagesByChatId } from '@/lib/db/supabase/queries';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase.auth.getUser();

  if (!session || !session.user || !session.user.id || error) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.user_id) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedModelId={selectedModelId}
        selectedVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.user_id}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
