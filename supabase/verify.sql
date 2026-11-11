-- Verification queries after schema.sql

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT relname, relrowsecurity
FROM pg_class
JOIN pg_namespace n ON n.oid = relnamespace
WHERE n.nspname = 'public'
  AND relname IN ('admins', 'tournaments', 'tournament_room_credentials');

SELECT p.proname, p.prosecdef
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'is_admin';

SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'tournaments';

SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'tournament_room_credentials';

SELECT count(*) AS admin_count FROM public.admins;
