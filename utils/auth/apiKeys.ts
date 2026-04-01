import crypto from "crypto";

const API_KEY_PREFIX = "nk_live";
const API_KEY_SECRET = process.env.API_KEY_HMAC_SECRET as string;

if (!API_KEY_SECRET) {
  throw new Error("Missing API_KEY_HMAC_SECRET");
}

export function generateApiKeyId(): string {
  return crypto.randomUUID();
}

export function generateApiKeySecret(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function signApiKeySecret(secret: string): string {
  return crypto
    .createHmac("sha256", API_KEY_SECRET)
    .update(secret)
    .digest("hex");
}

export function buildApiKey(keyId: string, secret: string): string {
  return `${API_KEY_PREFIX}_${keyId}.${secret}`;
}

export function parseApiKey(
  rawKey: string,
): { keyId: string; secret: string } | null {
  if (!rawKey) return null;

  const prefix = `${API_KEY_PREFIX}_`;
  if (!rawKey.startsWith(prefix)) return null;

  const remainder = rawKey.slice(prefix.length);
  const dotIndex = remainder.indexOf(".");

  if (dotIndex === -1) return null;

  const keyId = remainder.slice(0, dotIndex).trim();
  const secret = remainder.slice(dotIndex + 1).trim();

  if (!keyId || !secret) return null;

  return { keyId, secret };
}

export function safeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");

  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
