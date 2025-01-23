import { getChatsByUserId } from '@/lib/db/queries';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  const chats = await getChatsByUserId({ id: data.user.id! });
  return Response.json(chats);
}
