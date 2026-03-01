-- Create news table for TechTrendi
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'AI Tech',
    cover_image TEXT,
    is_published BOOLEAN DEFAULT false,
    read_time_minutes INTEGER DEFAULT 3,
    views INTEGER DEFAULT 0,
    meta_description TEXT,
    tags TEXT[],
    author TEXT DEFAULT 'TechTrendi Team',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS news_slug_idx ON public.news (slug);
CREATE INDEX IF NOT EXISTS news_category_idx ON public.news (category);
CREATE INDEX IF NOT EXISTS news_created_at_idx ON public.news (created_at DESC);
CREATE INDEX IF NOT EXISTS news_is_published_idx ON public.news (is_published);

-- Enable Row Level Security
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published news
CREATE POLICY "Anyone can read published news" ON public.news
    FOR SELECT
    USING (is_published = true);

-- Policy: Authenticated users can read all news (for admin)
CREATE POLICY "Authenticated users can read all news" ON public.news
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only authenticated users can insert news
CREATE POLICY "Authenticated users can insert news" ON public.news
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Only authenticated users can update news
CREATE POLICY "Authenticated users can update news" ON public.news
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Only authenticated users can delete news
CREATE POLICY "Authenticated users can delete news" ON public.news
    FOR DELETE
    TO authenticated
    USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS news_updated_at_trigger ON public.news;
CREATE TRIGGER news_updated_at_trigger
    BEFORE UPDATE ON public.news
    FOR EACH ROW
    EXECUTE FUNCTION public.update_news_updated_at();

-- Grant permissions
GRANT ALL ON public.news TO authenticated;
GRANT SELECT ON public.news TO anon;
