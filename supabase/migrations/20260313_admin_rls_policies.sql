-- Admin RLS policies: Allow users with 'admin' role to manage content tables
-- Run on VPS: psql -U supabase -d postgres -f /path/to/this/file.sql
-- Or via Supabase SQL editor

-- Helper: check if user has admin role
-- (uses existing has_role function if available, otherwise creates one)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- ARTICLES table — admin full access
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_articles_all' AND tablename = 'articles') THEN
    CREATE POLICY admin_articles_all ON public.articles FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================================
-- NEWS table — admin full access
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_news_all' AND tablename = 'news') THEN
    CREATE POLICY admin_news_all ON public.news FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================================
-- REVIEWS table — admin full access
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_reviews_all' AND tablename = 'reviews') THEN
    CREATE POLICY admin_reviews_all ON public.reviews FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================================
-- COMMENTS table — admin can manage all comments
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_comments_all' AND tablename = 'comments') THEN
    CREATE POLICY admin_comments_all ON public.comments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================================
-- REVIEW_COMMENTS table — admin full access
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_review_comments_all' AND tablename = 'review_comments') THEN
    CREATE POLICY admin_review_comments_all ON public.review_comments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================================
-- PROFILES table — admin can read all profiles
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_profiles_select' AND tablename = 'profiles') THEN
    CREATE POLICY admin_profiles_select ON public.profiles FOR SELECT USING (is_admin());
  END IF;
END $$;

-- ============================================================
-- USER_ROLES table — admin can manage roles
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_user_roles_all' AND tablename = 'user_roles') THEN
    CREATE POLICY admin_user_roles_all ON public.user_roles FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================================
-- CONTACT_SUBMISSIONS — admin can read/delete
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_contact_submissions_all' AND tablename = 'contact_submissions') THEN
    CREATE POLICY admin_contact_submissions_all ON public.contact_submissions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================================
-- NOTIFICATIONS — admin can manage
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_notifications_all' AND tablename = 'notifications') THEN
    CREATE POLICY admin_notifications_all ON public.notifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================================
-- CREEPY_TECH_POSTS — admin full access
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_creepy_tech_posts_all' AND tablename = 'creepy_tech_posts') THEN
    CREATE POLICY admin_creepy_tech_posts_all ON public.creepy_tech_posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================================
-- CYBER_AWARENESS_POSTS — admin full access
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_cyber_awareness_posts_all' AND tablename = 'cyber_awareness_posts') THEN
    CREATE POLICY admin_cyber_awareness_posts_all ON public.cyber_awareness_posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- Grant the is_admin function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
