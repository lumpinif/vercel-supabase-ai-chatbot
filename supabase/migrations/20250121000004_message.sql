-- Create Message table
CREATE TABLE IF NOT EXISTS public.message (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chat(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profile(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content JSONB NOT NULL,
    tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.message ENABLE ROW LEVEL SECURITY;

-- Add message policies
CREATE POLICY "Users can view messages from their chats" ON public.message
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.chat WHERE id = chat_id
        )
    );

CREATE POLICY "Users can create messages in their chats" ON public.message
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.chat WHERE id = chat_id
        )
    );

CREATE POLICY "Users can update their own messages" ON public.message
    FOR UPDATE USING (
        CASE 
            WHEN user_id IS NOT NULL THEN auth.uid() = user_id
            ELSE false
        END
    );
