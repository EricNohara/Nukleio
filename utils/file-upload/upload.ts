export async function uploadFile(
  file: File | null,
  bucketName: string,
): Promise<string> {
  if (!file || !bucketName) {
    throw new Error("Missing file or bucket name");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucketName", bucketName);

  const res = await fetch("/api/internal/storage", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  console.log(data);

  if (!res.ok) {
    throw new Error(data?.message ?? "File upload failed");
  }

  return data.publicURL;
}

export async function saveExternalFileUrl(
  externalUrl: string,
  bucketName: "portraits" | "resumes" | "transcripts",
): Promise<string> {
  const res = await fetch("/api/internal/storage", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ externalUrl, bucketName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "External file link failed");
  return data.publicURL;
}
