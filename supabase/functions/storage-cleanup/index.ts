// @ts-nocheck -- Supabase Edge Functions are type-checked by Deno.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function parsePublicObject(url: string): { bucket: string; path: string } | null {
  try {
    const pathname = new URL(url).pathname;
    const marker = "/storage/v1/object/public/";
    const index = pathname.indexOf(marker);
    if (index < 0) return null;
    const [bucket, ...parts] = pathname.slice(index + marker.length).split("/");
    return bucket && parts.length ? { bucket, path: parts.join("/") } : null;
  } catch {
    return null;
  }
}

async function removePublicObject(url: string): Promise<boolean> {
  const object = parsePublicObject(url);
  if (!object) return false;
  const { error } = await supabase.storage.from(object.bucket).remove([object.path]);
  if (error) return false;
  const ledger = await supabase.from("storage_quota_ledger").delete()
    .eq("bucket", object.bucket).eq("object_path", object.path);
  return !ledger.error;
}

Deno.serve(async (request) => {
  const expected = Deno.env.get("STORAGE_CLEANUP_CRON_SECRET");
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date().toISOString();
  const [resumes, headshots, expiringLedger, deletionQueue] = await Promise.all([
    supabase.from("cached_resumes").select("id,url").lte("expires_at", now).limit(500),
    supabase.from("cached_professional_headshots").select("id,generated_url").lte("expires_at", now).limit(500),
    supabase.from("storage_quota_ledger").select("id,bucket,object_path").not("expires_at", "is", null).lte("expires_at", now).limit(500),
    supabase.from("storage_deletion_queue").select("id,object_url").order("created_at").limit(500),
  ]);
  const listError = resumes.error ?? headshots.error ?? expiringLedger.error ?? deletionQueue.error;
  if (listError) return Response.json({ error: listError.message }, { status: 500 });

  let deleted = 0;
  let failed = 0;
  for (const item of resumes.data ?? []) {
    if (await removePublicObject(item.url)) {
      const result = await supabase.from("cached_resumes").delete().eq("id", item.id);
      result.error ? failed++ : deleted++;
    } else failed++;
  }
  for (const item of headshots.data ?? []) {
    if (await removePublicObject(item.generated_url)) {
      const result = await supabase.from("cached_professional_headshots").delete().eq("id", item.id);
      result.error ? failed++ : deleted++;
    } else failed++;
  }
  for (const item of expiringLedger.data ?? []) {
    const removal = await supabase.storage.from(item.bucket).remove([item.object_path]);
    if (!removal.error) {
      const result = await supabase.from("storage_quota_ledger").delete().eq("id", item.id);
      result.error ? failed++ : deleted++;
    } else failed++;
  }
  for (const item of deletionQueue.data ?? []) {
    if (await removePublicObject(item.object_url)) {
      const result = await supabase.from("storage_deletion_queue").delete().eq("id", item.id);
      result.error ? failed++ : deleted++;
    } else failed++;
  }

  await supabase.from("ai_cache_reservations").delete().lte("expires_at", now);
  return Response.json({ deleted, failed });
});
