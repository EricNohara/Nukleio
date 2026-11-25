-- One durable attempt and one short-lived worker lease per user. Only the
-- server may access these rows; Stripe idempotency keys derive from attempt_id.
CREATE TABLE public.checkout_attempts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL,
  price_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text,
  lease_id uuid,
  lease_until timestamptz
);
ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.checkout_attempts TO service_role;

CREATE FUNCTION public.acquire_checkout_attempt(p_user_id uuid, p_price_id text, p_lease_id uuid)
RETURNS SETOF public.checkout_attempts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.checkout_attempts (user_id, attempt_id, price_id, lease_id, lease_until)
  VALUES (p_user_id, gen_random_uuid(), p_price_id, p_lease_id, now() + interval '5 minutes')
  ON CONFLICT (user_id) DO UPDATE
    SET lease_id = p_lease_id, lease_until = now() + interval '5 minutes'
    WHERE public.checkout_attempts.lease_until IS NULL OR public.checkout_attempts.lease_until < now();
  RETURN QUERY SELECT * FROM public.checkout_attempts WHERE user_id = p_user_id AND lease_id = p_lease_id;
END;
$$;
REVOKE ALL ON FUNCTION public.acquire_checkout_attempt(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_checkout_attempt(uuid, text, uuid) TO service_role;
