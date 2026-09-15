import "server-only";

import parseURL from "@/utils/general/parseURL";
import { createAdminClient } from "@/utils/supabase/server";

/** Atomically reserves one of the user's 50 combined paid-cache slots. */
export async function reserveAiCacheSlot(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reserve_ai_cache_slot", {
    p_user_id: userId,
  });
  if (error || !data) throw error ?? new Error("Unable to reserve AI cache slot");

  // Best-effort eager processing. The daily Edge Function is the durable retry.
  await drainStorageDeletionQueue();
  return data as string;
}

export async function releaseAiCacheSlot(
  reservationId: string,
  userId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("ai_cache_reservations")
    .delete()
    .eq("id", reservationId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Commits the new cache item and queues the selected FIFO eviction. */
export async function finalizeAiCacheSlot(reservationId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("finalize_ai_cache_slot", {
    p_id: reservationId,
  });
  if (error) throw error;
  await drainStorageDeletionQueue();
}

async function drainStorageDeletionQueue(): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("storage_deletion_queue")
    .select("id, object_url")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return;

  for (const item of data ?? []) {
    const object = parseURL(item.object_url);
    if (!object) continue;
    const { error: removeError } = await admin.storage
      .from(object.parsedBucket)
      .remove([object.parsedFilename]);
    if (!removeError) {
      const ledger = await admin.from("storage_quota_ledger").delete()
        .eq("bucket", object.parsedBucket)
        .eq("object_path", object.parsedFilename);
      if (!ledger.error) {
        await admin.from("storage_deletion_queue").delete().eq("id", item.id);
      }
    }
  }
}
