import { getSuggestionsByDocumentId } from '@/lib/db/supabase/queries';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return new Response('Not Found', { status: 404 });
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase.auth.getUser();

  if (!session || !session.user || !session.user.id || error) {
    return new Response('Unauthorized', { status: 401 });
  }

  const suggestions = await getSuggestionsByDocumentId({
    document_id: documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if (suggestion.user_id !== session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json(suggestions, { status: 200 });
}
