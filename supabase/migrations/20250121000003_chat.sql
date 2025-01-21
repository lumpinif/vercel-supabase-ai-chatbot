-- Create Chat table
create table if not exists public.chat (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profile(id) on delete cascade,
    title text not null,
    description text,
    model text not null default 'system',
    temperature numeric(3,2) not null default 0.7 check (temperature >= 0 and temperature <= 2),
    visibility visibility_type not null default 'private',
    last_message_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Enable RLS
ALTER TABLE public.chat ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own chats" ON public.chat
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON public.chat
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON public.chat
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON public.chat
    FOR DELETE USING (auth.uid() = user_id);