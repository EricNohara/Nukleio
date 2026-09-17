import { createHmac, timingSafeEqual } from "crypto";

const APPROVAL_TTL_SECONDS = 10 * 60;

function secret(): string {
  const value = process.env.SIGNUP_ABUSE_HMAC_SECRET?.trim();
  if (!value) throw new Error("Missing SIGNUP_ABUSE_HMAC_SECRET");
  return value;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createOauthSignupApproval(provider: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + APPROVAL_TTL_SECONDS;
  const payload = `${provider}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidOauthSignupApproval(value: string | undefined, provider: string): boolean {
  if (!value) return false;
  const [approvedProvider, expiresAtRaw, signature, ...rest] = value.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (rest.length || approvedProvider !== provider || !Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000) || !signature) {
    return false;
  }

  const expected = sign(`${approvedProvider}.${expiresAt}`);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export const OAUTH_SIGNUP_APPROVAL_COOKIE = "nukleio_oauth_signup_approval";
export const OAUTH_SIGNUP_APPROVAL_MAX_AGE_SECONDS = APPROVAL_TTL_SECONDS;
