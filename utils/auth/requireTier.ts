import { getUserSubscriptionTier, Tier } from "./getUserSubscriptionTier";
import { NextResponse } from "next/server";

const ORDER: Record<Tier, number> = { free: 0, developer: 1, premium: 2 };

export async function requireTier(userId: string, min: Tier) {
  const tier: Tier = await getUserSubscriptionTier(userId);

  if (ORDER[tier] < ORDER[min]) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: `Please upgrade to ${min} tier to continue` },
        { status: 403 },
      ),
    };
  }

  return { ok: true as const, tier };
}
