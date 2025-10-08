export async function uploadFile(
  file: File | null,
  bucketName: string
): Promise<string | null> {
  if (!file || !bucketName || bucketName === "") return null;

  let publicURL = "";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucketName", bucketName);

  try {
    const res = await fetch("/api/internal/storage", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message.message);

    publicURL = data.publicURL;
  } catch (err) {
    const error = err as Error;
    console.error(err);
    alert("Error uploading file: " + error.message);
  }

  return publicURL;
}
