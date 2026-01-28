-- ============================================
-- STEP 1: Verify what tables exist
-- ============================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- STEP 2: Check article_reactions constraint
-- ============================================
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%reaction%';

-- ============================================
-- STEP 3: Fix reaction_type constraint if needed
-- ============================================
-- If you see old constraint with 'like', 'funny' instead of 'helpful', 'mindblown', run:

ALTER TABLE public.article_reactions DROP CONSTRAINT IF EXISTS article_reactions_reaction_type_check;

ALTER TABLE public.article_reactions
ADD CONSTRAINT article_reactions_reaction_type_check
CHECK (reaction_type IN ('helpful', 'love', 'fire', 'insightful', 'mindblown'));
