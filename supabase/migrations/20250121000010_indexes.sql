--Install the pg_trgm extension in the extensions schema
CREATE EXTENSION pg_trgm SCHEMA extensions;

-- Indexes for the profile table
CREATE INDEX IF NOT EXISTS idx_profile_id ON public.profile(id);
CREATE INDEX IF NOT EXISTS idx_profile_created_at ON public.profile(created_at);
CREATE INDEX IF NOT EXISTS idx_profile_email ON public.profile(email);

-- Indexes for the chat table
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON public.chat(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON public.chat(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_visibility ON public.chat(visibility);
CREATE INDEX IF NOT EXISTS idx_chat_title_gin ON public.chat USING gin(title gin_trgm_ops);

-- Indexes for the message table
CREATE INDEX IF NOT EXISTS idx_message_chat_id ON public.message(chat_id);
CREATE INDEX IF NOT EXISTS idx_message_user_id ON public.message(user_id);
CREATE INDEX IF NOT EXISTS idx_message_created_at ON public.message(created_at);
CREATE INDEX IF NOT EXISTS idx_message_role ON public.message(role);
CREATE INDEX IF NOT EXISTS idx_message_content_gin ON public.message USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_message_chat_created ON public.message(chat_id, created_at);

-- Indexes for the document table
CREATE INDEX IF NOT EXISTS idx_document_user_id ON public.document(user_id);
CREATE INDEX IF NOT EXISTS idx_document_created_at ON public.document(created_at);
CREATE INDEX IF NOT EXISTS idx_document_title_gin ON public.document USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_document_content_gin ON public.document USING gin(content gin_trgm_ops);

-- Indexes for the suggestion table
CREATE INDEX IF NOT EXISTS idx_suggestion_document_id ON public.suggestion(document_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_user_id ON public.suggestion(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_is_resolved ON public.suggestion(is_resolved);
CREATE INDEX IF NOT EXISTS idx_suggestion_created_at ON public.suggestion(created_at);

-- Indexes for the vote table
CREATE INDEX IF NOT EXISTS idx_vote_message_id ON public.vote(message_id);
CREATE INDEX IF NOT EXISTS idx_vote_chat_id ON public.vote(chat_id);
CREATE INDEX IF NOT EXISTS idx_vote_composite ON public.vote(message_id, chat_id);
CREATE INDEX IF NOT EXISTS idx_vote_user_message ON public.vote(user_id, message_id);

-- Indexes for the attachment table
CREATE INDEX IF NOT EXISTS idx_attachment_user_id ON public.attachment(user_id);
CREATE INDEX IF NOT EXISTS idx_attachment_chat_id ON public.attachment(chat_id);
CREATE INDEX IF NOT EXISTS idx_attachment_created_at ON public.attachment(created_at);
CREATE INDEX IF NOT EXISTS idx_attachment_visibility ON public.attachment(visibility);
CREATE INDEX IF NOT EXISTS idx_attachment_filename_gin ON public.attachment USING gin(filename gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_attachment_bucket_path ON public.attachment(bucket_name, storage_path);

-- Add compression for large text fields
ALTER TABLE public.document ALTER COLUMN content SET STORAGE EXTENDED;
ALTER TABLE public.message ALTER COLUMN content SET STORAGE EXTENDED;

-- Add partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_suggestion_unresolved 
    ON public.suggestion(created_at) 
    WHERE NOT is_resolved;

-- Add partial index for public attachments
CREATE INDEX IF NOT EXISTS idx_attachment_public 
    ON public.attachment(created_at) 
    WHERE visibility = 'public';

-- Add partial index for recent chats with messages
CREATE INDEX IF NOT EXISTS idx_chat_recent_active 
    ON public.chat(created_at) 
    WHERE EXISTS (
        SELECT 1 FROM public.message 
        WHERE message.chat_id = chat.id 
        AND message.created_at > NOW() - INTERVAL '30 days'
    );
