-- P0.2 phase one: hard storage limits, atomic reservations, paid AI cache
-- retention, and durable cleanup work. Improved recompression is phase two.
ALTER TABLE public.cached_resumes ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days');
ALTER TABLE public.cached_professional_headshots ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days');
ALTER TABLE public.cached_professional_headshots ALTER COLUMN reference_url DROP NOT NULL;
UPDATE public.cached_resumes SET expires_at = created_at + interval '30 days';
UPDATE public.cached_professional_headshots SET expires_at = created_at + interval '30 days';
CREATE INDEX IF NOT EXISTS cached_resumes_expiry_idx ON public.cached_resumes (expires_at);
CREATE INDEX IF NOT EXISTS cached_headshots_expiry_idx ON public.cached_professional_headshots (expires_at);
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Defense in depth: Storage itself rejects any new object over 1 MiB, even if
-- an upload path accidentally bypasses the application reservation API.
UPDATE storage.buckets SET file_size_limit=1048576;

CREATE TABLE IF NOT EXISTS public.storage_quota_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  object_path text NOT NULL,
  category text NOT NULL CHECK (category IN ('core', 'thumbnail', 'ai_cache', 'temporary')),
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  state text NOT NULL CHECK (state IN ('pending', 'active')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, object_path)
);
CREATE INDEX IF NOT EXISTS storage_quota_ledger_user_category_idx ON public.storage_quota_ledger (user_id, category, state);
CREATE INDEX IF NOT EXISTS storage_quota_ledger_expiry_idx ON public.storage_quota_ledger (expires_at) WHERE expires_at IS NOT NULL;
ALTER TABLE public.storage_quota_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.storage_quota_ledger FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.storage_quota_ledger TO service_role;

-- Backfill user-owned permanent objects so quotas are correct immediately.
INSERT INTO public.storage_quota_ledger (user_id,bucket,object_path,category,byte_size,state,expires_at,created_at)
SELECT u.id, o.bucket_id, o.name,
  CASE WHEN o.bucket_id='project_thumbnails' THEN 'thumbnail' ELSE 'core' END,
  COALESCE((o.metadata->>'size')::bigint,0), 'active', NULL,
  COALESCE(o.created_at,now())
FROM storage.objects o
JOIN public.users u ON o.name LIKE u.id::text || '-%'
WHERE o.bucket_id IN ('project_thumbnails','portraits','resumes','transcripts')
ON CONFLICT (bucket,object_path) DO NOTHING;

INSERT INTO public.storage_quota_ledger (user_id,bucket,object_path,category,byte_size,state,expires_at,created_at)
SELECT u.id,o.bucket_id,o.name,'ai_cache',
  COALESCE((o.metadata->>'size')::bigint,0),'active',NULL,
  COALESCE(o.created_at,now())
FROM storage.objects o
JOIN public.users u ON
  (o.bucket_id='professional_headshots' AND o.name LIKE 'generated/'||u.id::text||'/%') OR
  (o.bucket_id='generated_resumes' AND o.name LIKE u.id::text||'/%')
WHERE o.bucket_id IN ('professional_headshots','generated_resumes')
ON CONFLICT (bucket,object_path) DO NOTHING;

CREATE OR REPLACE FUNCTION public.reserve_storage_upload(
  p_user_id uuid, p_bucket text, p_object_path text, p_category text,
  p_byte_size bigint, p_is_premium boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_limit integer; v_current integer; v_project_bytes bigint; v_id uuid;
BEGIN
  IF p_byte_size<=0 OR p_byte_size>1048576 THEN RAISE EXCEPTION 'invalid storage size'; END IF;
  IF p_category NOT IN ('core','thumbnail','ai_cache','temporary') THEN RAISE EXCEPTION 'invalid storage category'; END IF;
  IF p_bucket NOT IN ('project_thumbnails','portraits','resumes','transcripts','professional_headshots','generated_resumes') THEN RAISE EXCEPTION 'invalid storage bucket'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('nukleio-storage-project',0));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,1));
  IF p_category IN ('core','thumbnail') AND EXISTS (SELECT 1 FROM public.storage_quota_ledger WHERE user_id=p_user_id AND state='pending' AND category IN ('core','thumbnail')) THEN
    RAISE EXCEPTION 'upload already in progress';
  END IF;
  IF p_category='thumbnail' THEN
    v_limit:=CASE WHEN p_is_premium THEN 10 ELSE 5 END;
    SELECT count(*) INTO v_current FROM public.storage_quota_ledger
      WHERE user_id=p_user_id AND category='thumbnail' AND state='active';
    IF v_current>=v_limit THEN RAISE EXCEPTION 'thumbnail quota reached'; END IF;
  END IF;
  SELECT COALESCE(sum(byte_size),0) INTO v_project_bytes FROM public.storage_quota_ledger;
  IF v_project_bytes+p_byte_size>1000000000 THEN RAISE EXCEPTION 'project storage quota reached'; END IF;
  INSERT INTO public.storage_quota_ledger(user_id,bucket,object_path,category,byte_size,state,expires_at)
    VALUES(p_user_id,p_bucket,p_object_path,p_category,p_byte_size,'pending',now()+interval '15 minutes')
    RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.reserve_storage_upload(uuid,text,text,text,bigint,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_storage_upload(uuid,text,text,text,bigint,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_storage_upload(p_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.storage_quota_ledger SET state='active',
    expires_at=CASE
      WHEN category='thumbnail' THEN now()+interval '24 hours'
      WHEN category='temporary' THEN now()+interval '15 minutes'
      ELSE NULL
    END
  WHERE id=p_id AND state='pending';
$$;
REVOKE ALL ON FUNCTION public.finalize_storage_upload(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_storage_upload(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_project_thumbnail(p_user_id uuid,p_bucket text,p_object_path text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.storage_quota_ledger SET expires_at=NULL
    WHERE user_id=p_user_id AND bucket=p_bucket AND object_path=p_object_path
      AND category='thumbnail' AND state='active';
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count=1;
END $$;
REVOKE ALL ON FUNCTION public.claim_project_thumbnail(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_project_thumbnail(uuid,text,text) TO service_role;

CREATE TABLE IF NOT EXISTS public.ai_cache_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  evict_table text CHECK (evict_table IN ('cached_resumes','cached_professional_headshots')),
  evict_id uuid,
  evict_url text,
  expires_at timestamptz NOT NULL DEFAULT (now()+interval '15 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((evict_table IS NULL AND evict_id IS NULL AND evict_url IS NULL) OR
         (evict_table IS NOT NULL AND evict_id IS NOT NULL AND evict_url IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ai_cache_reservations_user_idx ON public.ai_cache_reservations(user_id,expires_at);
ALTER TABLE public.ai_cache_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_cache_reservations FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.ai_cache_reservations TO service_role;

CREATE TABLE IF NOT EXISTS public.storage_deletion_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.storage_deletion_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.storage_deletion_queue FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.storage_deletion_queue TO service_role;

-- Bring pre-existing paid histories into compliance immediately. Each removed
-- row's object is retained in the durable deletion queue until Storage confirms
-- deletion.
DO $$
DECLARE v_item record;
BEGIN
  FOR v_item IN
    SELECT cache_table,cache_id,object_url FROM (
      SELECT cache_table,cache_id,object_url,
        row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC,cache_id DESC) AS rn
      FROM (
        SELECT 'cached_resumes'::text cache_table,id cache_id,user_id,url object_url,created_at
          FROM public.cached_resumes
        UNION ALL
        SELECT 'cached_professional_headshots',id,user_id,generated_url,created_at
          FROM public.cached_professional_headshots
      ) combined
    ) ranked WHERE rn>50
  LOOP
    INSERT INTO public.storage_deletion_queue(object_url) VALUES(v_item.object_url);
    IF v_item.cache_table='cached_resumes' THEN
      DELETE FROM public.cached_resumes WHERE id=v_item.cache_id;
    ELSE
      DELETE FROM public.cached_professional_headshots WHERE id=v_item.cache_id;
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.reserve_ai_cache_slot(p_user_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_total integer; v_evict_table text; v_evict_id uuid; v_evict_url text; v_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,2));
  DELETE FROM public.ai_cache_reservations WHERE expires_at<=now();
  SELECT
    (SELECT count(*) FROM public.cached_resumes WHERE user_id=p_user_id)+
    (SELECT count(*) FROM public.cached_professional_headshots WHERE user_id=p_user_id)+
    (SELECT count(*) FROM public.ai_cache_reservations WHERE user_id=p_user_id)
    INTO v_total;
  IF v_total>=50 THEN
    SELECT items.cache_table,items.cache_id,items.object_url
      INTO v_evict_table,v_evict_id,v_evict_url FROM (
      SELECT 'cached_resumes'::text cache_table,id cache_id,url object_url,created_at
        FROM public.cached_resumes WHERE user_id=p_user_id
      UNION ALL
      SELECT 'cached_professional_headshots',id,generated_url,created_at
        FROM public.cached_professional_headshots WHERE user_id=p_user_id
    ) items
    LEFT JOIN public.ai_cache_reservations reservations
      ON reservations.evict_table=items.cache_table AND reservations.evict_id=items.cache_id
    WHERE reservations.id IS NULL
    ORDER BY items.created_at,items.cache_id LIMIT 1;
    IF v_evict_id IS NULL THEN RAISE EXCEPTION 'AI cache is busy; retry shortly'; END IF;
  END IF;
  INSERT INTO public.ai_cache_reservations(user_id,evict_table,evict_id,evict_url)
    VALUES(p_user_id,v_evict_table,v_evict_id,v_evict_url)
    RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.reserve_ai_cache_slot(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_cache_slot(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_ai_cache_slot(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_reservation public.ai_cache_reservations%ROWTYPE;
BEGIN
  SELECT * INTO v_reservation FROM public.ai_cache_reservations WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'AI cache reservation not found'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_reservation.user_id::text,2));
  IF v_reservation.evict_id IS NOT NULL THEN
    IF v_reservation.evict_table='cached_resumes' THEN
      DELETE FROM public.cached_resumes WHERE id=v_reservation.evict_id AND user_id=v_reservation.user_id;
    ELSE
      DELETE FROM public.cached_professional_headshots WHERE id=v_reservation.evict_id AND user_id=v_reservation.user_id;
    END IF;
    INSERT INTO public.storage_deletion_queue(object_url) VALUES(v_reservation.evict_url);
  END IF;
  DELETE FROM public.ai_cache_reservations WHERE id=p_id;
END $$;
REVOKE ALL ON FUNCTION public.finalize_ai_cache_slot(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_ai_cache_slot(uuid) TO service_role;
