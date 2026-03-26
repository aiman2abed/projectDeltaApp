-- RLS hardening for public.users.
-- This migration removes any recursive/self-referencing users-table policies
-- and enforces a single self-read policy with explicit UUID->text casting.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own user data" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read own row" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "admin_read_all_users" ON public.users;
DROP POLICY IF EXISTS "Admin users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users select policy" ON public.users;
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;

CREATE POLICY "users_self_read"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid()::text = id);
