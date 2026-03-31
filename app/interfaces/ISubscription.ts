export interface ISubscription {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  updated_at: string;
}

export interface ISubscriptionPublicInfo {
  status: string | null;
  price_id: string | null;
}
