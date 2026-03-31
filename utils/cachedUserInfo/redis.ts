import { Redis } from "@upstash/redis";

let redisSingleton: Redis | null = null;

export function getRedis(): Redis {
  if (!redisSingleton) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error("Missing Upstash Redis environment variables");
    }

    redisSingleton = new Redis({ url, token });
  }

  return redisSingleton;
}

// cache version 1
export function getUserInfoCacheKey(userId: string) {
  return `user-info:v1:${userId}`;
}

// TTL settings
export const PREMIUM_USER_INFO_TTL_SECONDS = 60 * 20;
export const DEVELOPER_USER_INFO_TTL_SECONDS = 60 * 10;
export const FREE_USER_INFO_TTL_SECONDS = 60 * 5;

export function getUserTtlSettings(
  priceId: string | null | undefined,
  status: string | null | undefined,
) {
  if (status !== "active" && status !== "trialing") {
    return FREE_USER_INFO_TTL_SECONDS;
  }

  switch (priceId) {
    case process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_ID:
      return PREMIUM_USER_INFO_TTL_SECONDS;
    case process.env.NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_ID:
      return PREMIUM_USER_INFO_TTL_SECONDS;
    case process.env.NEXT_PUBLIC_DEVELOPER_MONTHLY_PRICE_ID:
      return DEVELOPER_USER_INFO_TTL_SECONDS;
    case process.env.NEXT_PUBLIC_DEVELOPER_YEARLY_PRICE_ID:
      return DEVELOPER_USER_INFO_TTL_SECONDS;
    default:
      return FREE_USER_INFO_TTL_SECONDS;
  }
}
