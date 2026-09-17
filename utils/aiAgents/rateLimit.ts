import { createHash } from "crypto";

import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";

import { getAgentAwsConfig } from "./awsConfig";
import {
  AiAgentOperation,
  getAiAgentOperationLabel,
} from "./operations";

export const AI_RATE_LIMIT_REQUESTS = 10;
export const AI_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const AI_RATE_LIMIT_TTL_GRACE_SECONDS = 60 * 60;

const NAMESPACE_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

export type AiRateLimitResult = {
  allowed: boolean;
  limit: number;
  retryAfterSeconds: number;
  windowEndsAtSeconds: number;
};

type DynamoDbSender = {
  send(command: TransactWriteItemsCommand): Promise<unknown>;
};

type ConsumeAiRateLimitInput = {
  operation: AiAgentOperation | "storage_upload";
  requestId: string;
  userId: string;
  client?: DynamoDbSender;
  namespace?: string;
  nowMs?: number;
  tableName?: string;
  limit?: number;
  windowSeconds?: number;
};

export class AiRateLimitServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AiRateLimitServiceError";
  }
}

let cachedClient: DynamoDBClient | null = null;
let cachedClientKey = "";

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

function requiredRateLimitEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new AiRateLimitServiceError(`Missing ${name}`);
  return value;
}

export function getRateLimitWindow(nowMs: number): {
  windowStartSeconds: number;
  windowEndsAtSeconds: number;
} {
  const nowSeconds = Math.floor(nowMs / 1000);
  const windowStartSeconds =
    Math.floor(nowSeconds / AI_RATE_LIMIT_WINDOW_SECONDS) *
    AI_RATE_LIMIT_WINDOW_SECONDS;
  return {
    windowStartSeconds,
    windowEndsAtSeconds: windowStartSeconds + AI_RATE_LIMIT_WINDOW_SECONDS,
  };
}

function isRateLimitConditionFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    name?: unknown;
    CancellationReasons?: { Code?: string }[];
  };
  return (
    candidate.name === "TransactionCanceledException" &&
    candidate.CancellationReasons?.[0]?.Code === "ConditionalCheckFailed"
  );
}

export async function consumeAiRateLimit({
  operation,
  requestId,
  userId,
  client = getDynamoDbClient(),
  namespace = requiredRateLimitEnvironmentValue(
    "AI_AGENT_RATE_LIMIT_NAMESPACE",
  ),
  nowMs = Date.now(),
  tableName = requiredRateLimitEnvironmentValue(
    "AI_AGENT_RATE_LIMIT_TABLE_NAME",
  ),
  limit = AI_RATE_LIMIT_REQUESTS,
  windowSeconds = AI_RATE_LIMIT_WINDOW_SECONDS,
}: ConsumeAiRateLimitInput): Promise<AiRateLimitResult> {
  if (!NAMESPACE_PATTERN.test(namespace)) {
    throw new AiRateLimitServiceError(
      "AI_AGENT_RATE_LIMIT_NAMESPACE must contain only letters, numbers, underscores, or hyphens",
    );
  }

  const nowSeconds = Math.floor(nowMs / 1000);
  const windowStartSeconds = Math.floor(nowSeconds / windowSeconds) * windowSeconds;
  const windowEndsAtSeconds = windowStartSeconds + windowSeconds;
  const retryAfterSeconds = Math.max(
    1,
    windowEndsAtSeconds - Math.floor(nowMs / 1000),
  );
  const rateLimitKey = [
    namespace,
    userId,
    operation,
    windowStartSeconds,
  ].join(":");
  const transactionToken = createHash("sha256")
    .update(`${requestId}:${rateLimitKey}`)
    .digest("base64url")
    .slice(0, 36);

  const command = new TransactWriteItemsCommand({
    ClientRequestToken: transactionToken,
    TransactItems: [
      {
        Update: {
          TableName: tableName,
          Key: { rate_limit_key: { S: rateLimitKey } },
          UpdateExpression:
            "SET #count = if_not_exists(#count, :zero) + :one, " +
            "#expiresAt = if_not_exists(#expiresAt, :expiresAt)",
          ConditionExpression:
            "attribute_not_exists(#count) OR #count < :limit",
          ExpressionAttributeNames: {
            "#count": "request_count",
            "#expiresAt": "expires_at",
          },
          ExpressionAttributeValues: {
            ":zero": { N: "0" },
            ":one": { N: "1" },
            ":limit": { N: String(limit) },
            ":expiresAt": {
              N: String(
                windowEndsAtSeconds + AI_RATE_LIMIT_TTL_GRACE_SECONDS,
              ),
            },
          },
        },
      },
    ],
  });

  try {
    await client.send(command);
    return {
      allowed: true,
      limit,
      retryAfterSeconds,
      windowEndsAtSeconds,
    };
  } catch (error) {
    if (isRateLimitConditionFailure(error)) {
      return {
        allowed: false,
        limit,
        retryAfterSeconds,
        windowEndsAtSeconds,
      };
    }

    throw new AiRateLimitServiceError(
      "Unable to enforce the AI request rate limit",
      { cause: error },
    );
  }
}

export function getAiRateLimitMessage(
  operation: AiAgentOperation,
  retryAfterSeconds: number,
): string {
  const retryMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `You have reached the limit of ${AI_RATE_LIMIT_REQUESTS} requests per 10 minutes for ${getAiAgentOperationLabel(operation)}. Try again in about ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`;
}
