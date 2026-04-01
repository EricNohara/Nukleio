/* eslint-disable */
import { SupabaseClient } from "@supabase/supabase-js";

export async function refreshCachedUserInfo(
  supabase: SupabaseClient<any, "public", any>,
  userId: string,
) {
  // refresh the database cache
  const { error } = await supabase.rpc("refresh_cached_user_info", {
    p_user_id: userId,
  });

  if (error) throw error;
}
