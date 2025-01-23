-- Create Document table
CREATE TABLE IF NOT EXISTS public.document (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    kind public.block_kind not null default 'text'::block_kind,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    -- Add unique constraint for the composite key
    UNIQUE (id, created_at)
);

-- Enable RLS
ALTER TABLE public.document ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents" 
ON public.document 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own documents" 
ON public.document 
FOR INSERT 
TO authenticated 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.document 
FOR UPDATE 
TO authenticated 
USING ((select auth.uid()) = user_id) 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.document 
FOR DELETE 
TO authenticated 
USING ((select auth.uid()) = user_id);