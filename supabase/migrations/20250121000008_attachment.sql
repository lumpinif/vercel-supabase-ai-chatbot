-- Create the attachment table with all required columns and constraints
CREATE TABLE public.attachment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chat(id) ON DELETE CASCADE,
    bucket_name TEXT NOT NULL DEFAULT 'chat_attachment',
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    access_path TEXT NOT NULL,
    public_url TEXT,
    visibility visibility_type NOT NULL DEFAULT 'private',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Composite unique constraints
    CONSTRAINT attachment_unique_version UNIQUE (bucket_name, storage_path, version),
    CONSTRAINT attachment_unique_per_chat UNIQUE (user_id, chat_id, filename, version)
);

-- Enable RLS
ALTER TABLE public.attachment ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attachment
CREATE POLICY "Users can insert their own attachments"
ON public.attachment
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own attachments"
ON public.attachment
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
ON public.attachment
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Function to get next version for an attachment
CREATE OR REPLACE FUNCTION get_next_attachment_version(
    p_bucket_name TEXT,
    p_storage_path TEXT
) RETURNS INTEGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version), 0) + 1
    INTO next_version
    FROM public.attachment
    WHERE bucket_name = p_bucket_name 
    AND storage_path = p_storage_path;
    
    RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to set version
CREATE OR REPLACE FUNCTION set_attachment_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version = 1 THEN  -- Only auto-increment if not explicitly set
        NEW.version := get_next_attachment_version(NEW.bucket_name, NEW.storage_path);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version handling
CREATE TRIGGER handle_attachment_version
    BEFORE INSERT ON public.attachment
    FOR EACH ROW
    EXECUTE FUNCTION set_attachment_version();