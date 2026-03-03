import { NextRequest, NextResponse } from "next/server";

import { stripe } from "@/utils/stripe/stripe";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";

type Body = { priceId: string };

function isPaidStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function POST(req: NextRequest) {
  try {
    const { priceId } = (await req.json()) as Body;

    if (!priceId || !priceId.startsWith("price_")) {
      return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up stripe_customer_id from subscriptions (single-table approach)
    const { data: subRow, error: subErr } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    let stripeCustomerId = subRow?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id }, // webhook fallback
      });

      stripeCustomerId = customer.id;

      // Use service-role client for upsert (RLS-safe)
      const admin = createServiceRoleClient();
      const { error: upsertErr } = await admin.from("subscriptions").upsert(
        {
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL!;

    // Prevent multiple subscriptions - send to portal if existing sub
    if (isPaidStatus(subRow?.status)) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${appUrl}/user/settings/billing`,
      });

      return NextResponse.json(
        { url: portal.url, mode: "portal" },
        { status: 200 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/user/settings/billing`,
      cancel_url: `${appUrl}/user/settings/billing`,
      client_reference_id: user.id,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const error = err as Error;
    console.error("checkout error", error);
    return NextResponse.json(
      { error: error?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
