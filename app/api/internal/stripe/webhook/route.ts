import { NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/utils/stripe/stripe";
import { createServiceRoleClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

function toIso(unix: number | null | undefined) {
  return unix ? new Date(unix * 1000).toISOString() : null;
}

async function getUserIdForCustomer(customerId: string) {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!error && data?.user_id) return data.user_id;

  const customer = (await stripe.customers.retrieve(
    customerId,
  )) as Stripe.Customer;
  const userId =
    typeof customer.metadata?.user_id === "string"
      ? customer.metadata.user_id
      : null;

  return userId;
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig)
    return new NextResponse("Missing stripe-signature", { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const error = err as Error;
    console.error("Webhook signature verify failed:", error?.message);
    return new NextResponse(`Webhook Error: ${error?.message}`, {
      status: 400,
    });
  }

  const admin = createServiceRoleClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        const userId = await getUserIdForCustomer(customerId);
        if (!userId) {
          console.warn(
            "No userId for customer:",
            customerId,
            "event:",
            event.type,
          );
          return new NextResponse("ok", { status: 200 });
        }

        const item = sub.items?.data?.[0] ?? null;
        const priceId = item?.price?.id ?? null;

        // IMPORTANT: period end should come from the subscription object (webhook payload)
        // eslint-disable-next-line
        const currentPeriodEndUnix = (sub as any).current_period_end ?? null;

        const payload = {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          status: sub.status,
          price_id: priceId,
          current_period_end: toIso(currentPeriodEndUnix),
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertErr } = await admin
          .from("subscriptions")
          .upsert(payload, { onConflict: "user_id" });

        if (upsertErr) throw upsertErr;
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        const userId = session.client_reference_id;

        if (customerId && userId) {
          const { error } = await admin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

          if (error) throw error;
        }
        break;
      }

      default:
        break;
    }

    return new NextResponse("ok", { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error("Webhook handler error:", error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
