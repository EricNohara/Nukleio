import { NextResponse } from "next/server";

import { stripe } from "@/utils/stripe/stripe";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: subRow, error: subErr } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    if (!subRow?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found. Start checkout first." },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL!;
    const portal = await stripe.billingPortal.sessions.create({
      customer: subRow.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    const error = err as Error;
    console.error("portal error", error);
    return NextResponse.json(
      { error: error?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
