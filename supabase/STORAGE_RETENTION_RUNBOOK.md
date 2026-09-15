# P0.2 storage deployment runbook

Run these steps once in development, verify them, and then repeat against production.

## 1. Apply the database migration

From the repository root, link the intended project and push migrations:

```powershell
npx supabase link --project-ref <project-ref>
npx supabase db push
```

The migration adds the quota ledger and backfill, enforces the 1 MiB object and
1 GB project limits atomically, enforces 5/10 stored thumbnails, adds the
combined 50-item paid AI cache reservation, and adds 30-day expirations.

## 2. Deploy the cleanup Edge Function

Generate a long random value and set it as an Edge Function secret:

```powershell
npx supabase secrets set STORAGE_CLEANUP_CRON_SECRET=<random-secret>
npx supabase functions deploy storage-cleanup --no-verify-jwt
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied automatically to
hosted Edge Functions. Do not put the service-role key in the cron request.

## 3. Store cron values in Vault and schedule the daily call

In the Supabase SQL editor, replace the two placeholders and run:

```sql
select vault.create_secret(
  'https://<project-ref>.supabase.co',
  'storage_cleanup_project_url'
);

select vault.create_secret(
  '<the-same-random-secret>',
  'storage_cleanup_cron_secret'
);

select cron.unschedule(jobid)
from cron.job
where jobname = 'storage-cleanup-daily';

select cron.schedule(
  'storage-cleanup-daily',
  '17 3 * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets
            where name = 'storage_cleanup_project_url') || '/functions/v1/storage-cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret
        from vault.decrypted_secrets where name = 'storage_cleanup_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $job$
);
```

The schedule runs daily at 03:17 UTC. The function deletes expired 30-day AI
cache outputs, abandoned/failed upload reservations, unattached thumbnails,
and queued FIFO evictions. Failed Storage deletions remain queued for retry.

## 4. Smoke test before deploying the app

Invoke the function once with the custom secret and confirm HTTP 200:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://<project-ref>.supabase.co/functions/v1/storage-cleanup" `
  -Headers @{ Authorization = "Bearer <random-secret>" } `
  -ContentType "application/json" `
  -Body "{}"
```

Then verify `cron.job` contains one active `storage-cleanup-daily` row and check
`cron.job_run_details` after a manual or scheduled run.

## 5. Deploy runtime code in this order

1. Apply this migration.
2. Deploy the `storage-cleanup` function and create its cron schedule.
3. Deploy the professional-headshot and resume Lambdas.
4. Deploy the Nukleio/Vercel app.

The agent request schemas default omitted `deliveryMode` to `cached`, so the
Lambda deployment remains compatible with the previous app during rollout.
