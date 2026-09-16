import { randomUUID } from "crypto";

import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";

import { getAgentAwsConfig } from "@/utils/aiAgents/awsConfig";

export type CompressionMediaKind =
  | "portrait"
  | "project-thumbnail"
  | "resume"
  | "transcript";

type CompressionOperation = "compress_file_prepare" | "compress_file";

function getCompressionUrl(path: string): URL {
  const baseUrl = process.env.FILE_COMPRESSION_AGENT_BASE_URL?.trim();
  if (!baseUrl) throw new Error("Missing FILE_COMPRESSION_AGENT_BASE_URL");
  const config = getAgentAwsConfig();
  const url = new URL(baseUrl);
  const expectedSuffix = `.lambda-url.${config.region}.on.aws`;
  if (url.protocol !== "https:" || !url.hostname.endsWith(expectedSuffix)) {
    throw new Error("Invalid FILE_COMPRESSION_AGENT_BASE_URL");
  }
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  return url;
}

async function invokeCompressionAgent<TBody>(
  path: string,
  operation: CompressionOperation,
  body: TBody,
): Promise<Response> {
  const config = getAgentAwsConfig();
  const url = getCompressionUrl(path);
  const serializedBody = JSON.stringify(body);
  const signer = new SignatureV4({
    credentials: config.credentials,
    region: config.region,
    service: "lambda",
    sha256: Sha256,
  });
  const signed = await signer.sign(new HttpRequest({
    protocol: url.protocol,
    hostname: url.hostname,
    method: "POST",
    path: url.pathname,
    headers: {
      host: url.host,
      "content-type": "application/json",
      "x-nukleio-operation": operation,
      "x-nukleio-request-id": randomUUID(),
    },
    body: serializedBody,
  }));
  const headers = Object.fromEntries(
    Object.entries(signed.headers).filter(([name]) => name.toLowerCase() !== "host"),
  );
  return fetch(url, { method: "POST", headers, body: serializedBody, cache: "no-store" });
}

export function prepareFileCompression(input: {
  contentType: string;
  mediaKind: CompressionMediaKind;
}) {
  return invokeCompressionAgent("prepare", "compress_file_prepare", input);
}

export function compressStagedFile(input: {
  contentType: string;
  jobId: string;
  mediaKind: CompressionMediaKind;
}) {
  return invokeCompressionAgent("compress", "compress_file", input);
}
