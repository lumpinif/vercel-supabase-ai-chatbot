-- Create Vote table
CREATE TABLE IF NOT EXISTS public.vote (
    chat_id UUID NOT NULL REFERENCES public.chat(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.message(id) ON DELETE CASCADE,
    is_upvoted BOOLEAN NOT NULL,
    -- Set composite primary key
    PRIMARY KEY (chat_id, message_id)
);

-- Enable Row Level Security
ALTER TABLE public.vote ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view votes on their chats" ON public.vote
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.chat WHERE id = chat_id
        )
    );

CREATE POLICY "Users can create votes on their chats" ON public.vote
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.chat WHERE id = chat_id
        )
    );

CREATE POLICY "Users can update votes on their chats" ON public.vote
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM public.chat WHERE id = chat_id
        )
    );

CREATE POLICY "Users can delete votes on their chats" ON public.vote
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM public.chat WHERE id = chat_id
        )
    ); 

