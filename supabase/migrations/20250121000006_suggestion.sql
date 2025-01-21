-- Create Suggestion table
CREATE TABLE IF NOT EXISTS public.suggestion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
    document_id UUID NOT NULL,
    document_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    original_text TEXT NOT NULL,
    suggested_text TEXT NOT NULL,
    description TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    FOREIGN KEY (document_id, document_created_at) 
        REFERENCES public.document(id, created_at) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.suggestion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own suggestions" 
ON public.suggestion 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own suggestions" 
ON public.suggestion 
FOR INSERT 
TO authenticated 
WITH CHECK ((select auth.uid()) = user_id);

-- CREATE POLICY "Users can update their own suggestions" 
-- ON public.suggestion 
-- FOR UPDATE 
-- TO authenticated 
-- USING ((select auth.uid()) = user_id) 
-- WITH CHECK ((select auth.uid()) = user_id);

-- CREATE POLICY "Users can delete their own suggestions" 
-- ON public.suggestion 
-- FOR DELETE 
-- TO authenticated 
-- USING ((select auth.uid()) = user_id);