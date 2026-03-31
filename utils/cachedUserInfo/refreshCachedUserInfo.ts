/* eslint-disable */
import { SupabaseClient } from "@supabase/supabase-js";
import { getRedis, getUserInfoCacheKey } from "./redis";

export async function refreshCachedUserInfo(
  supabase: SupabaseClient<any, "public", any>,
  userId: string,
) {
  // refresh the database cache
  const { error } = await supabase.rpc("refresh_cached_user_info", {
    p_user_id: userId,
  });

  if (error) throw error;

  // Invalidate Redis cache if present
  try {
    const redis = getRedis();
    const redisKey = getUserInfoCacheKey(userId);

    await redis.del(redisKey);
  } catch (redisErr) {
    console.error(
      "Failed to invalidate Redis user info cache:",
      (redisErr as Error).message,
    );
  }
}
