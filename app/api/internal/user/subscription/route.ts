import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

type Tier = "free" | "developer" | "premium";

const PRICE_TO_TIER: Record<string, Exclude<Tier, "free">> = {
  [process.env.NEXT_PUBLIC_DEVELOPER_MONTHLY_PRICE_ID!]: "developer",
  [process.env.NEXT_PUBLIC_DEVELOPER_YEARLY_PRICE_ID!]: "developer",
  [process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_ID!]: "premium",
  [process.env.NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_ID!]: "premium",
};

function isPaidStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function GET(_: NextRequest) {
  try {
    const supabase = await createClient();

    // get current user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // lookup subscription row
    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .select(
        "status, price_id, current_period_end, cancel_at_period_end, updated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const status = sub?.status ?? null;
    const currentPeriodEnd = sub?.current_period_end ?? null;
    const cancelAtPeriodEnd = sub?.cancel_at_period_end ?? null;
    const updatedAt = sub?.updated_at ?? null;
    const priceId = sub?.price_id ?? null;

    // compute tier
    let tier: Tier = "free";
    if (isPaidStatus(status) && priceId && PRICE_TO_TIER[priceId]) {
      tier = PRICE_TO_TIER[priceId];
    }

    const payload = {
      tier,
      status,
      priceId,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      updatedAt,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error("tier route error", error);
    return NextResponse.json(
      { error: error?.message ?? "Internal Server error" },
      { status: 500 },
    );
  }
}
