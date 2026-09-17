import { createHmac, randomBytes, randomUUID } from "crypto";

import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";

import { getAgentAwsConfig } from "@/utils/aiAgents/awsConfig";

import type { NextRequest } from "next/server";


const IP_LIMIT = 30;
const IP_WINDOW_SECONDS = 15 * 60;
const EMAIL_LIMIT = 10;
const EMAIL_WINDOW_SECONDS = 15 * 60;
const DEVICE_LIMIT = 5;
const DEVICE_WINDOW_SECONDS = 24 * 60 * 60;
const RESEND_IP_LIMIT = 50;
const RESEND_IP_WINDOW_SECONDS = 60 * 60;
const RESEND_EMAIL_MINUTE_LIMIT = 1;
const RESEND_EMAIL_MINUTE_WINDOW_SECONDS = 60;
const RESEND_EMAIL_HOUR_LIMIT = 20;
const RESEND_EMAIL_HOUR_WINDOW_SECONDS = 60 * 60;
const TTL_GRACE_SECONDS = 60 * 60;
const DEVICE_COOKIE_NAME = "nukleio_signup_device";
const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

type DynamoDbSender = {
  send(command: TransactWriteItemsCommand): Promise<unknown>;
};

export type SignupDevice = {
  value: string;
  isNew: boolean;
};

export type SignupRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export class SignupRateLimitServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SignupRateLimitServiceError";
  }
}

let cachedClient: DynamoDBClient | null = null;
let cachedClientKey = "";

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new SignupRateLimitServiceError(`Missing ${name}`);
  return value;
}

function getDynamoDbClient(): DynamoDBClient {
  const config = getAgentAwsConfig();
  const clientKey = `${config.region}:${config.credentials.accessKeyId}`;
  if (!cachedClient || cachedClientKey !== clientKey) {
    cachedClient = new DynamoDBClient({
      credentials: config.credentials,
      region: config.region,
      maxAttempts: 3,
    });
    cachedClientKey = clientKey;
  }
  return cachedClient;
}

function hashIdentifier(value: string): string {
  return createHmac(
    "sha256",
    requiredEnvironmentValue("SIGNUP_ABUSE_HMAC_SECRET"),
  )
    .update(value)
    .digest("base64url");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getWindow(nowSeconds: number, windowSeconds: number) {
  const start = Math.floor(nowSeconds / windowSeconds) * windowSeconds;
  return { start, endsAt: start + windowSeconds };
}

function isConditionalFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    name?: unknown;
    CancellationReasons?: { Code?: string }[];
  };
  return (
    candidate.name === "TransactionCanceledException" &&
    !!candidate.CancellationReasons?.some(
      (reason) => reason.Code === "ConditionalCheckFailed",
    )
  );
}

export function getSignupDevice(request: NextRequest): SignupDevice {
  const existing = request.cookies.get(DEVICE_COOKIE_NAME)?.value;
  if (existing && DEVICE_ID_PATTERN.test(existing)) {
    return { value: existing, isNew: false };
  }
  return { value: randomBytes(32).toString("base64url"), isNew: true };
}

export function getSignupDeviceCookieName(): string {
  return DEVICE_COOKIE_NAME;
}

function getTrustedClientIp(request: NextRequest): string {
  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelIp) return vercelIp;

  // Vercel injects x-vercel-id. Only then is the forwarded header considered
  // platform-provided rather than an arbitrary value supplied by a client.
  if (request.headers.get("x-vercel-id")) {
    const forwarded = request.headers.get("x-forwarded-for")?.trim();
    if (forwarded) return forwarded.split(",", 1)[0].trim();
  }

  // Local development has no trusted platform address. A shared bucket keeps
  // the limiter fail-closed without persisting an untrusted raw header.
  return "unavailable";
}

export async function consumeSignupRateLimit({
  request,
  email,
  client = getDynamoDbClient(),
  namespace = requiredEnvironmentValue("AI_AGENT_RATE_LIMIT_NAMESPACE"),
  tableName = requiredEnvironmentValue("AI_AGENT_RATE_LIMIT_TABLE_NAME"),
  nowMs = Date.now(),
}: {
  request: NextRequest;
  email: string;
  client?: DynamoDbSender;
  namespace?: string;
  tableName?: string;
  nowMs?: number;
}): Promise<SignupRateLimitResult> {
  const nowSeconds = Math.floor(nowMs / 1000);
  const ipWindow = getWindow(nowSeconds, IP_WINDOW_SECONDS);
  const emailWindow = getWindow(nowSeconds, EMAIL_WINDOW_SECONDS);
  const ipKey = `${namespace}:signup:ip:${hashIdentifier(getTrustedClientIp(request))}:${ipWindow.start}`;
  const emailKey = `${namespace}:signup:email:${hashIdentifier(normalizeEmail(email))}:${emailWindow.start}`;
  const retryAfterSeconds = Math.max(
    1,
    Math.min(ipWindow.endsAt, emailWindow.endsAt) - nowSeconds,
  );

  const update = (key: string, limit: number, expiresAt: number) => ({
    Update: {
      TableName: tableName,
      Key: { rate_limit_key: { S: key } },
      UpdateExpression:
        "SET #count = if_not_exists(#count, :zero) + :one, " +
        "#expiresAt = if_not_exists(#expiresAt, :expiresAt)",
      ConditionExpression: "attribute_not_exists(#count) OR #count < :limit",
      ExpressionAttributeNames: {
        "#count": "request_count",
        "#expiresAt": "expires_at",
      },
      ExpressionAttributeValues: {
        ":zero": { N: "0" },
        ":one": { N: "1" },
        ":limit": { N: String(limit) },
        ":expiresAt": { N: String(expiresAt + TTL_GRACE_SECONDS) },
      },
    },
  });

  try {
    await client.send(
      new TransactWriteItemsCommand({
        ClientRequestToken: randomUUID(),
        TransactItems: [
          update(ipKey, IP_LIMIT, ipWindow.endsAt),
          update(emailKey, EMAIL_LIMIT, emailWindow.endsAt),
        ],
      }),
    );
    return { allowed: true, retryAfterSeconds };
  } catch (error) {
    if (isConditionalFailure(error)) {
      return { allowed: false, retryAfterSeconds };
    }
    throw new SignupRateLimitServiceError("Unable to enforce signup limits", {
      cause: error,
    });
  }
}

export async function consumeSuccessfulSignupDeviceLimit({
  device,
  client = getDynamoDbClient(),
  namespace = requiredEnvironmentValue("AI_AGENT_RATE_LIMIT_NAMESPACE"),
  tableName = requiredEnvironmentValue("AI_AGENT_RATE_LIMIT_TABLE_NAME"),
  nowMs = Date.now(),
}: {
  device: SignupDevice;
  client?: DynamoDbSender;
  namespace?: string;
  tableName?: string;
  nowMs?: number;
}): Promise<SignupRateLimitResult> {
  const nowSeconds = Math.floor(nowMs / 1000);
  const window = getWindow(nowSeconds, DEVICE_WINDOW_SECONDS);
  const key = `${namespace}:signup:device-success:${hashIdentifier(device.value)}:${window.start}`;

  try {
    await client.send(
      new TransactWriteItemsCommand({
        ClientRequestToken: randomUUID(),
        TransactItems: [
          {
            Update: {
              TableName: tableName,
              Key: { rate_limit_key: { S: key } },
              UpdateExpression:
                "SET #count = if_not_exists(#count, :zero) + :one, " +
                "#expiresAt = if_not_exists(#expiresAt, :expiresAt)",
              ConditionExpression: "attribute_not_exists(#count) OR #count < :limit",
              ExpressionAttributeNames: {
                "#count": "request_count",
                "#expiresAt": "expires_at",
              },
              ExpressionAttributeValues: {
                ":zero": { N: "0" },
                ":one": { N: "1" },
                ":limit": { N: String(DEVICE_LIMIT) },
                ":expiresAt": { N: String(window.endsAt + TTL_GRACE_SECONDS) },
              },
            },
          },
        ],
      }),
    );
    return { allowed: true, retryAfterSeconds: Math.max(1, window.endsAt - nowSeconds) };
  } catch (error) {
    if (isConditionalFailure(error)) {
      return { allowed: false, retryAfterSeconds: Math.max(1, window.endsAt - nowSeconds) };
    }
    throw new SignupRateLimitServiceError("Unable to enforce successful signup limits", { cause: error });
  }
}

export async function consumeResendConfirmationRateLimit({
  request,
  email,
  client = getDynamoDbClient(),
  namespace = requiredEnvironmentValue("AI_AGENT_RATE_LIMIT_NAMESPACE"),
  tableName = requiredEnvironmentValue("AI_AGENT_RATE_LIMIT_TABLE_NAME"),
  nowMs = Date.now(),
}: {
  request: NextRequest;
  email: string;
  client?: DynamoDbSender;
  namespace?: string;
  tableName?: string;
  nowMs?: number;
}): Promise<SignupRateLimitResult> {
  const nowSeconds = Math.floor(nowMs / 1000);
  const ipWindow = getWindow(nowSeconds, RESEND_IP_WINDOW_SECONDS);
  const emailMinuteWindow = getWindow(nowSeconds, RESEND_EMAIL_MINUTE_WINDOW_SECONDS);
  const emailHourWindow = getWindow(nowSeconds, RESEND_EMAIL_HOUR_WINDOW_SECONDS);
  const emailHash = hashIdentifier(normalizeEmail(email));
  const ipKey = `${namespace}:resend-confirmation:ip:${hashIdentifier(getTrustedClientIp(request))}:${ipWindow.start}`;
  const emailMinuteKey = `${namespace}:resend-confirmation:email-minute:${emailHash}:${emailMinuteWindow.start}`;
  const emailHourKey = `${namespace}:resend-confirmation:email-hour:${emailHash}:${emailHourWindow.start}`;
  const retryAfterSeconds = Math.max(1, Math.min(
    ipWindow.endsAt,
    emailMinuteWindow.endsAt,
    emailHourWindow.endsAt,
  ) - nowSeconds);
  const update = (key: string, limit: number, expiresAt: number) => ({
    Update: {
      TableName: tableName,
      Key: { rate_limit_key: { S: key } },
      UpdateExpression:
        "SET #count = if_not_exists(#count, :zero) + :one, " +
        "#expiresAt = if_not_exists(#expiresAt, :expiresAt)",
      ConditionExpression: "attribute_not_exists(#count) OR #count < :limit",
      ExpressionAttributeNames: { "#count": "request_count", "#expiresAt": "expires_at" },
      ExpressionAttributeValues: {
        ":zero": { N: "0" }, ":one": { N: "1" }, ":limit": { N: String(limit) },
        ":expiresAt": { N: String(expiresAt + TTL_GRACE_SECONDS) },
      },
    },
  });

  try {
    await client.send(new TransactWriteItemsCommand({
      ClientRequestToken: randomUUID(),
      TransactItems: [
        update(ipKey, RESEND_IP_LIMIT, ipWindow.endsAt),
        update(emailMinuteKey, RESEND_EMAIL_MINUTE_LIMIT, emailMinuteWindow.endsAt),
        update(emailHourKey, RESEND_EMAIL_HOUR_LIMIT, emailHourWindow.endsAt),
      ],
    }));
    return { allowed: true, retryAfterSeconds };
  } catch (error) {
    if (isConditionalFailure(error)) return { allowed: false, retryAfterSeconds };
    throw new SignupRateLimitServiceError("Unable to enforce confirmation resend limits", { cause: error });
  }
}
