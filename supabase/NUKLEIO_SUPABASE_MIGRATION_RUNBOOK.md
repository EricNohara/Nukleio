# Nukleio Supabase Database Migration Runbook

This document describes how to manage database schema updates between Nukleio's two hosted Supabase environments:

- **Development:** used by localhost, development builds, and preview deployments
- **Production:** used by the live Nukleio application and real customers

The database migration files are stored in the Nukleio Git repository under:

```text
supabase/migrations/
```

Because Nukleio is open source, these migrations may be public. They must contain **database structure only**, never production data, passwords, API keys, OAuth secrets, Stripe secrets, or other credentials.

---

## 1. Environment architecture

```text
Local Nukleio app ────────────────> Hosted Supabase Development
Vercel preview deployments ───────> Hosted Supabase Development
Vercel production deployment ─────> Hosted Supabase Production
```

Use separate Supabase credentials for each environment.

### Vercel Preview environment

Configure the same **development** Supabase URL and keys under Vercel's Preview environment variables.

---

## 2. Core rule

> After migrations are established, do not make schema changes directly in either hosted Supabase Dashboard.

Do not use the hosted Table Editor or SQL Editor to add, remove, or modify:

- tables
- columns
- indexes
- constraints
- enums
- database functions
- triggers
- views
- RLS policies
- grants

Direct hosted schema edits bypass the migration history and can cause the environments to drift or make future `db push` operations fail.

Instead:

1. Create a migration file in the repository.
2. Push it to the hosted development project.
3. Test it.
4. Push the exact same migration to production.

Using the Dashboard to inspect tables, browse data, or edit disposable development records is fine. The restriction applies to **schema changes**.

---

## 3. One-time CLI setup

Run these commands from the root of the Nukleio repository.

### Install the Supabase CLI

```powershell
npm install supabase --save-dev
```

Use the local CLI through `npx` so the project uses a known version.

### Initialize Supabase files

```powershell
npx supabase init
```

This creates the `supabase/` directory.

### Sign in

```powershell
npx supabase login
```

### Add environment labels locally

Create an untracked reference file such as:

```text
docs/private/supabase-projects.txt
```

or keep the values in a password manager:

```text
DEV_PROJECT_REF=<development project reference>
PROD_PROJECT_REF=<production project reference>
```

Do not commit database passwords or access tokens.

---

## 4. One-time creation of the development database

Use this section only when initially creating the hosted development project.

### Step 1: Create the development project

In the Supabase Dashboard:

1. Create a second project.
2. Name it clearly, such as `nukleio-development`.
3. Keep the existing project clearly named `nukleio-production`.
4. Save each database password securely.

### Step 2: Capture the existing production schema

Link the repository to production:

```powershell
npx supabase link --project-ref <PROD_PROJECT_REF>
```

Pull the current production schema as the baseline migration:

```powershell
npx supabase db pull
```

A file similar to this will be generated:

```text
supabase/migrations/20260724120000_remote_schema.sql
```

Review this file before continuing. The generated migration represents the existing production database structure.

### Step 3: Apply the baseline to development

Relink to development:

```powershell
npx supabase link --project-ref <DEV_PROJECT_REF>
```

Preview the operation:

```powershell
npx supabase db push --dry-run
```

Confirm that:

- the linked project is development
- the pending migration is the baseline schema
- no production data or secrets are present

Apply it:

```powershell
npx supabase db push
```

### Step 4: Configure non-database services separately

Migrations do not automatically reproduce all project-level configuration. Configure development-specific versions of:

- Auth providers
- Auth redirect URLs
- email/SMTP settings
- Storage buckets and any required bucket configuration
- Edge Function secrets
- webhook destinations and secrets
- third-party API credentials
- scheduled jobs
- custom domains
- production-only integrations

Use development credentials and sandbox integrations wherever available.

### Step 5: Add fake development data

Use fake or sanitized records only.

Do not copy real customer data into development.

You may maintain reproducible sample data in:

```text
supabase/seed.sql
```

Be careful when deploying seed data. Development seed data should not be pushed into production unless the records are intentionally required there.

### Step 6: Commit the baseline

```powershell
git add supabase
git commit -m "Add initial Supabase database migration"
```

---

## 5. Standard workflow for every future schema change

New public tables, sequences, and routines do not automatically grant access to
`authenticated`. Include only the explicit grants needed by the application in
each migration, alongside appropriate RLS policies. PostgreSQL's default PUBLIC
routine execution is revoked globally for new routines created by `postgres`;
future routines in other schemas also need explicit grants where appropriate.
These defaults are per creating role: review any other role that can create
application objects. Existing object grants are unchanged. After applying the
default-privileges migration, run `supabase/tests/default_privileges.sql` as
`postgres` against development and production, for example by pasting the full
script into the Supabase SQL Editor using the `postgres` role. It rolls its
probe objects back. Run it after migration deployment and whenever default grants
or the migration-creating role change; a raised exception means verification
failed. Review the target project before running it.

Example change: adding a `username` column to `profiles`.

### Step 1: Update your Git branch

```powershell
git checkout main
git pull
git checkout -b feature/add-profile-username
```

This reduces the chance of creating a migration on top of outdated migration history.

### Step 2: Create a migration

```powershell
npx supabase migration new add_profile_username
```

This creates a timestamped file:

```text
supabase/migrations/<timestamp>_add_profile_username.sql
```

Open the file and write the SQL:

```sql
alter table public.profiles
add column username text;
```

For destructive changes, prefer a staged migration strategy rather than immediately dropping or renaming objects used by the deployed application.

### Step 3: Review the SQL

Check for:

- the correct schema and table
- appropriate nullability and defaults
- indexes for frequently queried columns
- foreign keys and delete behavior
- RLS implications
- backward compatibility with the currently deployed app
- safe handling of existing rows
- no secrets or customer data

### Step 4: Push the migration to development

Explicitly link to development:

```powershell
npx supabase link --project-ref <DEV_PROJECT_REF>
```

Preview pending migrations:

```powershell
npx supabase db push --dry-run
```

Apply them:

```powershell
npx supabase db push
```

### Step 5: Test in development

Test the hosted development environment thoroughly:

- old application behavior still works
- new application behavior works
- inserts and updates succeed
- existing rows behave correctly
- RLS allows only intended access
- anonymous and authenticated roles behave correctly
- service-role operations remain server-side
- Storage or database functions still work
- generated API/types match the new schema

Do not promote the migration until development testing passes.

### Step 6: Update generated TypeScript types, when used

Generate types from the development project:

```powershell
npx supabase gen types typescript --project-id <DEV_PROJECT_REF> --schema public > src/types/database.types.ts
```

Adjust the output path to Nukleio's actual type-file location.

Review and commit the generated type changes with the migration.

### Step 7: Commit and review

```powershell
git add supabase/migrations src/types/database.types.ts
git commit -m "Add username to profiles"
git push -u origin feature/add-profile-username
```

Open a pull request and review:

- migration SQL
- application changes
- RLS changes
- generated types
- rollout order
- rollback or forward-fix plan

### Step 8: Promote the same migration to production

After the change has passed development testing and code review, link explicitly to production:

```powershell
npx supabase link --project-ref <PROD_PROJECT_REF>
```

Run the mandatory dry run:

```powershell
npx supabase db push --dry-run
```

Confirm:

- the project reference is production
- only the expected migrations are pending
- the SQL is safe for live data
- the application deployment is compatible

Apply the migration:

```powershell
npx supabase db push
```

### Step 9: Deploy the application

Use the rollout order appropriate for the change.

For backward-compatible additions, the usual sequence is:

```text
1. Add database column/table/function
2. Verify the production migration
3. Deploy application code that uses it
```

For destructive or incompatible changes, use an expand-and-contract rollout described later in this document.

### Step 10: Verify production

Perform focused checks:

- production health checks pass
- affected pages and API endpoints work
- inserts and updates work
- RLS is enforced
- logs contain no new database errors
- critical queries perform normally

---

## 6. Fast command checklist

### Push a new migration to development

```powershell
npx supabase migration new <CHANGE_NAME>
# Edit the generated SQL file.

npx supabase link --project-ref <DEV_PROJECT_REF>
npx supabase db push --dry-run
npx supabase db push
```

### Promote tested migrations to production

```powershell
npx supabase link --project-ref <PROD_PROJECT_REF>
npx supabase db push --dry-run
npx supabase db push
```

### Generate TypeScript types from development

```powershell
npx supabase gen types typescript --project-id <DEV_PROJECT_REF> --schema public > src/types/database.types.ts
```

---

## 7. Safe migration examples

### Add a nullable column

```sql
alter table public.profiles
add column username text;
```

### Add a column with a default

```sql
alter table public.profiles
add column is_public boolean not null default true;
```

### Add an index

```sql
create index profiles_username_idx
on public.profiles (username);
```

### Add a unique index that permits multiple nulls

```sql
create unique index profiles_username_unique_idx
on public.profiles (lower(username))
where username is not null;
```

### Add an RLS policy

```sql
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

### Replace a database function

```sql
create or replace function public.example_function()
returns text
language sql
security invoker
set search_path = ''
as $$
  select 'example';
$$;
```

Review all functions for appropriate `security invoker` versus `security definer` behavior and a safe `search_path`.

---

## 8. Destructive changes: expand and contract

Do not combine an incompatible schema change and dependent application change into one risky release.

Example: renaming `display_name` to `full_name`.

### Release A: Expand

1. Add `full_name`.
2. Keep `display_name`.
3. Backfill existing records.
4. Update writes to populate both fields if necessary.

```sql
alter table public.profiles
add column full_name text;

update public.profiles
set full_name = display_name
where full_name is null;
```

### Release B: Migrate application usage

1. Deploy code that reads and writes `full_name`.
2. Verify production no longer depends on `display_name`.

### Release C: Contract

Create a later migration that removes the old column:

```sql
alter table public.profiles
drop column display_name;
```

This strategy prevents the live application from breaking while old and new code versions overlap during deployment.

---

## 9. Data migrations

A schema migration may include controlled data transformations required by the schema change.

Example:

```sql
update public.profiles
set username = lower(replace(display_name, ' ', '-'))
where username is null;
```

Before running a production data migration:

- estimate how many rows it affects
- test it in development with representative data
- ensure uniqueness constraints will not fail
- consider batching very large updates
- ensure the operation will not lock critical tables for too long
- take or verify an appropriate production backup
- avoid embedding real production data in the migration file

A migration may contain transformation logic, but it should not contain copied customer records.

---

## 10. RLS and security checklist

Every new table exposed through Supabase APIs should be reviewed for Row Level Security.

For each table:

1. Decide whether the client should access it directly.
2. Enable RLS where appropriate.
3. Add explicit policies for required operations.
4. Test as:
   - anonymous user
   - authenticated owner
   - authenticated non-owner
   - server-side service role
5. Verify users cannot modify:
   - subscription tiers
   - billing state
   - ownership identifiers
   - internal moderation fields
   - privileged role fields

The service-role key bypasses RLS and must never be exposed to the browser.

Open-source migrations being visible is not a security problem when authorization is correctly implemented. The schema must be secure even when an attacker knows exactly how it works.

---

## 11. Accidentally changed the development Dashboard

The normal rule is to avoid direct hosted schema edits.

If a schema change was accidentally made in the development Dashboard:

1. Stop making further changes.
2. Link to development:

```powershell
npx supabase link --project-ref <DEV_PROJECT_REF>
```

3. Pull the remote difference into a named migration:

```powershell
npx supabase db pull -f capture_accidental_dev_change
```

4. Carefully inspect the generated SQL.
5. Remove unrelated or unsafe statements.
6. Verify migration history and test the resulting migration.
7. Commit it before promoting anything to production.

Do not manually repeat the Dashboard steps in production. Capture, review, and push the migration.

If the generated diff is confusing or contains unexpected statements, do not apply it to production until the discrepancy is understood.

---

## 12. Migration fails in development

If a migration fails:

1. Read the PostgreSQL error.
2. Fix the migration before it reaches production.
3. Determine whether any statements were applied before the failure.
4. Inspect the development schema and migration history.
5. Prefer a new corrective migration if the failed migration was already shared or applied.
6. Do not rewrite an applied production migration.

During early development, an unapplied local migration may be edited freely. Once a migration has been applied to a shared or production environment, treat it as immutable.

---

## 13. Migration fails in production

Do not repeatedly rerun commands without understanding the failure.

1. Stop the deployment.
2. Preserve the exact error output.
3. Check whether the migration was partially applied.
4. Check application health.
5. Decide whether the safest response is:
   - complete the intended change with a forward-fix migration
   - restore from backup
   - temporarily roll back application code
6. Verify migration history before the next `db push`.

For production databases, a tested forward fix is often safer than attempting to reverse complex data transformations.

---

## 14. Rollback strategy

Supabase migrations are forward-running SQL files. A reliable rollback requires planning.

For each high-risk change, decide before release:

- Can the app temporarily ignore the new object?
- Can a new migration restore the old schema?
- Would reverting lose transformed data?
- Is a database backup required?
- Can the application be rolled back independently?

Example compensating migration:

```sql
alter table public.profiles
drop column if exists username;
```

This is only safe when no valuable data depends on the column.

Never assume every migration is cleanly reversible.

---

## 15. Recommended Git policy

- One migration per logical database change.
- Use descriptive migration names.
- Commit migrations with the application code that requires them.
- Do not modify migration files already applied to production.
- Require pull-request review for RLS and destructive changes.
- Keep migration order intact.
- Resolve conflicting migrations before merging.
- Always pull the latest default branch before creating a migration.
- Run `db push --dry-run` before every production push.

Example migration names:

```text
add_profile_username
create_portfolio_analytics_table
add_project_visibility_policy
index_api_key_hash
remove_legacy_resume_column
```

---

## 16. Changes not fully managed by database migrations

Some Supabase project configuration may require separate deployment or manual setup:

- Auth provider credentials
- Auth redirect URLs
- SMTP settings
- project secrets
- third-party webhook secrets
- custom domains
- some scheduled infrastructure
- existing Auth users
- Storage file contents
- production customer data

Track these in a separate environment checklist without committing secret values.

Example:

```text
docs/environment-configuration.md
```

That file can describe which settings exist in development and production while referencing secrets by name only.

---

## 17. Pre-production checklist

Before every production database update:

- [ ] Migration passed in hosted development
- [ ] Migration SQL was reviewed
- [ ] Production project ref was verified
- [ ] `db push --dry-run` showed only expected migrations
- [ ] RLS changes were tested
- [ ] Existing rows were considered
- [ ] Application compatibility was verified
- [ ] Destructive changes use expand-and-contract
- [ ] Backup requirements were considered
- [ ] No secrets or real customer data appear in the migration
- [ ] Generated TypeScript types were updated if needed
- [ ] Production verification steps are ready

---

## 18. Post-production checklist

After applying migrations:

- [ ] Migration command completed successfully
- [ ] Production application loads
- [ ] Relevant API endpoints work
- [ ] Reads, inserts, and updates work
- [ ] RLS denies unauthorized access
- [ ] Logs show no unexpected database errors
- [ ] Performance is acceptable
- [ ] Application deployment completed
- [ ] Migration and related code are merged into the default branch

---

## 19. Official references

- Supabase database migrations:  
  https://supabase.com/docs/guides/deployment/database-migrations

- Supabase environment management:  
  https://supabase.com/docs/guides/deployment/managing-environments

- Supabase CLI workflow:  
  https://supabase.com/docs/guides/local-development/cli-workflows

- Supabase CLI `db push`:  
  https://supabase.com/docs/reference/cli/supabase-db-push

- Supabase CLI `db pull`:  
  https://supabase.com/docs/reference/cli/supabase-db-pull

- Supabase database testing:  
  https://supabase.com/docs/guides/database/testing

---

## Final workflow summary

```text
Create migration file in Git
          ↓
Review SQL
          ↓
Link CLI to hosted development
          ↓
db push --dry-run
          ↓
db push
          ↓
Test application and RLS in development
          ↓
Commit migration + application changes
          ↓
Review and merge
          ↓
Link CLI to production
          ↓
db push --dry-run
          ↓
db push
          ↓
Deploy and verify production
```

The migration file—not the Dashboard—is the source of truth for every database schema update.
