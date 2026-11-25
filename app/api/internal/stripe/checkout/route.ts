import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { stripe } from "@/utils/stripe/stripe";
import { getSubscriptionPlanForPriceId } from "@/utils/subscriptions/config";
import { createAdminClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
type Attempt = { attempt_id: string; price_id: string; created_at: string; session_id: string | null };

export async function POST(req: NextRequest) {
  let lease: { userId: string; id: string } | null = null;
  const admin = createAdminClient();
  try {
    const { user, response } = await getAuthenticatedUser();
    if (!user) return response;
    const body: unknown = await req.json().catch(() => null);
    const priceId = body && typeof body === "object" && "priceId" in body ? (body as { priceId?: unknown }).priceId : null;
    const plan = typeof priceId === "string" ? getSubscriptionPlanForPriceId(priceId) : null;
    if (!plan || typeof priceId !== "string") return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product;
    const amount = plan.tier === "developer" ? (plan.interval === "monthly" ? 99 : 1099) : (plan.interval === "monthly" ? 499 : 5499);
    if (typeof product === "string" || product.deleted || !product.active || !price.active || price.currency !== "usd" || price.unit_amount !== amount || price.billing_scheme !== "per_unit" || price.type !== "recurring" || price.recurring?.interval !== (plan.interval === "monthly" ? "month" : "year") || price.recurring.interval_count !== 1 || price.recurring.usage_type !== "licensed") {
      console.error("Configured Stripe price failed validation", { priceId });
      return NextResponse.json({ error: "This plan is temporarily unavailable" }, { status: 503 });
    }
    const leaseId = randomUUID();
    const acquired = await admin.rpc("acquire_checkout_attempt", { p_user_id: user.id, p_price_id: priceId, p_lease_id: leaseId });
    if (acquired.error) throw acquired.error;
    let attempt = (acquired.data as Attempt[] | null)?.[0];
    if (!attempt) return NextResponse.json({ error: "Checkout is already being prepared. Please try again." }, { status: 409 });
    lease = { userId: user.id, id: leaseId };
    const sub = await admin.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    if (sub.error) throw sub.error;
    let customerId = sub.data?.stripe_customer_id as string | null | undefined;
    if (!attempt.session_id && Date.now() - Date.parse(attempt.created_at) > 20 * 60 * 60 * 1000) return NextResponse.json({ error: "Checkout needs assistance. Please contact support." }, { status: 409 });
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { user_id: user.id } }, { idempotencyKey: `checkout-customer-${attempt.attempt_id}` });
      customerId = customer.id;
      const saved = await admin.from("subscriptions").upsert({ user_id: user.id, stripe_customer_id: customerId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (saved.error) throw saved.error;
    }
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!appUrl) throw new Error("Site URL missing");
    for await (const subscription of stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 })) {
      if (!["canceled", "incomplete_expired"].includes(subscription.status)) {
        const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${appUrl}/user/settings/billing` });
        return NextResponse.json({ url: portal.url, mode: "portal" });
      }
    }
    if (attempt.session_id) {
      const session = await stripe.checkout.sessions.retrieve(attempt.session_id);
      if (session.status === "complete") {
        if (!session.subscription) return NextResponse.json({ error: "Checkout is complete and is being processed." }, { status: 409 });
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (!["canceled", "incomplete_expired"].includes(subscription.status)) return NextResponse.json({ error: "Checkout is complete and is being processed." }, { status: 409 });
      }
      if (session.status === "open") {
        if (attempt.price_id !== priceId) return NextResponse.json({ error: "An existing checkout is open for another plan. Finish it or wait for it to expire." }, { status: 409 });
        return NextResponse.json({ url: session.url });
      }
      if (session.status !== "expired" && session.status !== "complete") throw new Error("Unexpected checkout session status");
      const replacement = { attempt_id: randomUUID(), price_id: priceId, created_at: new Date().toISOString(), session_id: null };
      const updated = await admin.from("checkout_attempts").update(replacement).eq("user_id", user.id).eq("lease_id", leaseId).select("attempt_id,price_id,created_at,session_id").single();
      if (updated.error) throw updated.error;
      attempt = updated.data as Attempt;
    }
    if (attempt.price_id !== priceId) return NextResponse.json({ error: "A checkout for another plan is being prepared. Please retry that plan." }, { status: 409 });
    const session = await stripe.checkout.sessions.create({ mode: "subscription", customer: customerId, line_items: [{ price: priceId, quantity: 1 }], success_url: `${appUrl}/user/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${appUrl}/user/settings/billing?checkout=cancelled`, client_reference_id: user.id, allow_promotion_codes: true }, { idempotencyKey: `checkout-session-${attempt.attempt_id}` });
    const saved = await admin.from("checkout_attempts").update({ session_id: session.id }).eq("user_id", user.id).eq("lease_id", leaseId).select("user_id").single();
    if (saved.error) throw saved.error;
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout failed", error);
    return NextResponse.json({ error: "Unable to start checkout. Please try again." }, { status: 500 });
  } finally {
    if (lease) {
      const released = await admin.from("checkout_attempts").update({ lease_id: null, lease_until: null }).eq("user_id", lease.userId).eq("lease_id", lease.id);
      if (released.error) console.error("Could not release checkout lease", released.error);
    }
  }
}
