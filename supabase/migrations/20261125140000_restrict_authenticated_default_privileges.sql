-- These defaults apply to objects subsequently created by postgres; they do
-- not change existing object grants. Each migration must grant its own access.
-- Global defaults are additive with schema defaults. Remove authenticated's
-- global grants too, in case a hosted project has additional global defaults.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON SEQUENCES FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON ROUTINES FROM authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON ROUTINES FROM authenticated;

-- PostgreSQL grants PUBLIC routine execution globally by default. A
-- schema-only REVOKE cannot cancel that global grant. This affects future
-- postgres-owned routines in every schema, not already-created routines.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON ROUTINES FROM PUBLIC;
