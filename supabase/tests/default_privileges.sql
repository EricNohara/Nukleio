-- Run as postgres in a disposable or development database after migrations.
-- The transaction rolls back the probe objects even on a successful run.
BEGIN;

DO $$ BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Run this check as postgres; defaults depend on the creating role';
  END IF;
END $$;

CREATE TABLE public.nukleio_default_acl_probe (id integer);
CREATE SEQUENCE public.nukleio_default_acl_probe_seq;
CREATE FUNCTION public.nukleio_default_acl_probe_fn() RETURNS integer
  LANGUAGE sql AS $$ SELECT 1 $$;

DO $$
DECLARE
  role_name text;
  privilege_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
      IF has_table_privilege(role_name, 'public.nukleio_default_acl_probe', privilege_name) THEN
        RAISE EXCEPTION '% unexpectedly has table %', role_name, privilege_name;
      END IF;
    END LOOP;
    FOREACH privilege_name IN ARRAY ARRAY['USAGE', 'SELECT', 'UPDATE'] LOOP
      IF has_sequence_privilege(role_name, 'public.nukleio_default_acl_probe_seq', privilege_name) THEN
        RAISE EXCEPTION '% unexpectedly has sequence %', role_name, privilege_name;
      END IF;
    END LOOP;
    IF has_function_privilege(role_name, 'public.nukleio_default_acl_probe_fn()', 'EXECUTE') THEN
      RAISE EXCEPTION '% unexpectedly has function EXECUTE', role_name;
    END IF;
  END LOOP;
  IF NOT has_table_privilege('service_role', 'public.nukleio_default_acl_probe', 'SELECT')
     OR NOT has_sequence_privilege('service_role', 'public.nukleio_default_acl_probe_seq', 'USAGE')
     OR NOT has_function_privilege('service_role', 'public.nukleio_default_acl_probe_fn()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Expected service_role defaults are missing';
  END IF;
END $$;

ROLLBACK;
