"use client";

type MediaKind = "portrait" | "project-thumbnail" | "resume" | "transcript";

type PreparedUpload = {
  jobId: string;
  upload: { url: string; fields: Record<string, string> };
};

function extensionForContentType(contentType: string): string {
  return contentType === "application/pdf" ? "pdf" : "webp";
}

export async function compressStoredFile(file: File, mediaKind: MediaKind): Promise<File> {
  const prepareResponse = await fetch("/api/internal/fileCompression/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, mediaKind }),
  });
  const prepared = await prepareResponse.json() as PreparedUpload & { message?: string };
  if (!prepareResponse.ok || !prepared.jobId || !prepared.upload) {
    throw new Error(prepared.message ?? "Unable to prepare file compression");
  }

  const formData = new FormData();
  Object.entries(prepared.upload.fields).forEach(([name, value]) => formData.append(name, value));
  formData.append("file", file);
  const uploadResponse = await fetch(prepared.upload.url, { method: "POST", body: formData });
  if (!uploadResponse.ok) throw new Error("Unable to upload file for compression");

  const compressResponse = await fetch("/api/internal/fileCompression/compress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, jobId: prepared.jobId, mediaKind }),
  });
  if (!compressResponse.ok) {
    const data = await compressResponse.json().catch(() => null);
    throw new Error(data?.message ?? "File could not be compressed");
  }
  const contentType = compressResponse.headers.get("content-type") ?? "application/octet-stream";
  const blob = await compressResponse.blob();
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${extensionForContentType(contentType)}`, {
    type: contentType,
  });
}
