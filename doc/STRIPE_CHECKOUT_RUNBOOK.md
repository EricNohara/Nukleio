# Stripe checkout deployment and verification

Apply the checkout-attempt migration to development before deploying the app.
The existing four `NEXT_PUBLIC_*_PRICE_ID` variables must reference the intended
Stripe test-mode prices in development and live-mode prices in production. The
server checks active products and prices against USD 0.99/month, 10.99/year,
4.99/month, and 54.99/year respectively. Update the checkout validation and UI
together when changing prices. Verify each configured price points to the intended
product before rollout; the server checks that the associated product is active,
but does not independently allowlist product IDs. Incorrect configuration can
prevent checkout or associate a plan with the wrong active product.

In Stripe test mode, verify all four plans, an unconfigured price, an inactive
product or mismatched amount, repeat and simultaneous requests, switching plans while a
checkout is open, an expired session, and an existing subscription. Confirm one
customer and at most one open checkout session are created for an account.
Test an interrupted request and webhook delay. Apply and verify the same
migration and configuration in production before deploying production code.

If an attempt has no recorded session after 20 hours, checkout fails closed
because the Stripe idempotency record may expire. Support must inspect the
account's customer and Checkout Sessions in Stripe, resolve any open or
completed session and confirm there is no active subscription before clearing
the user's checkout_attempts row. Never clear a row while a request is in
flight or while its Checkout Session can still complete.
