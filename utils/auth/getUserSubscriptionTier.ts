import { createClient } from "../supabase/server";

export type Tier = "free" | "developer" | "premium";

const PRICE_TO_TIER: Record<string, Exclude<Tier, "free">> = {
  [process.env.NEXT_PUBLIC_DEVELOPER_MONTHLY_PRICE_ID!]: "developer",
  [process.env.NEXT_PUBLIC_DEVELOPER_YEARLY_PRICE_ID!]: "developer",
  [process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_ID!]: "premium",
  [process.env.NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_ID!]: "premium",
};

function isPaidStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function getUserSubscriptionTier(userId: string): Promise<Tier> {
  const supabase = await createClient();

  // get the sub for the user
  const { data } = await supabase
    .from("subscriptions")
    .select("status, price_id")
    .eq("user_id", userId)
    .maybeSingle();

  const status = data?.status ?? null;
  const priceId = data?.price_id ?? null;

  // derive the tier
  let tier: Tier = "free";
  if (isPaidStatus(status) && priceId && PRICE_TO_TIER[priceId]) {
    tier = PRICE_TO_TIER[priceId];
  }

  return tier;
}
