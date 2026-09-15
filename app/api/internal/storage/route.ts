import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { isAccountActive } from "@/utils/accountDeletion/status";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { getUserSubscriptionTier } from "@/utils/auth/getUserSubscriptionTier";
import { refreshCachedUserInfo } from "@/utils/cachedUserInfo/refreshCachedUserInfo";
import parseURL, { isStorageObjectOwnedByUser } from "@/utils/general/parseURL";
import { createAdminClient } from "@/utils/supabase/server";

const ALLOWED_BUCKETS = ["project_thumbnails", "portraits", "resumes", "transcripts"];
const MAX_STORED_FILE_BYTES = 1024 * 1024;
const MAX_MULTIPART_BODY_BYTES = MAX_STORED_FILE_BYTES + 64 * 1024;
const DOCUMENT_FIELDS = {
  portraits: "portrait_url",
  resumes: "resume_url",
  transcripts: "transcript_url",
} as const;

type DocumentBucket = keyof typeof DOCUMENT_FIELDS;
type DocumentField = (typeof DOCUMENT_FIELDS)[DocumentBucket];
type DocumentURLRow = Partial<Record<DocumentField, string | null>>;

function isDocumentBucket(value: string): value is DocumentBucket {
  return value in DOCUMENT_FIELDS;
}

function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function sanitizeFilename(filename: string): string {
  return filename.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_").slice(-160) || "upload";
}

async function removeObjectAndLedger(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  path: string,
  objectUrl?: string,
): Promise<void> {
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) {
    if (objectUrl) {
      const queued = await admin.from("storage_deletion_queue").insert({ object_url: objectUrl });
      if (!queued.error) return;
    }
    throw error;
  }
  const { error: ledgerError } = await admin.from("storage_quota_ledger")
    .delete().eq("bucket", bucket).eq("object_path", path);
  if (ledgerError) throw ledgerError;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const admin = createAdminClient();
  let reservationId: string | null = null;
  let uploaded: { bucket: string; path: string } | null = null;

  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BODY_BYTES) {
      return NextResponse.json({ message: "Files must be 1 MB or smaller." }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const bucketName = formData.get("bucketName");
    if (!(file instanceof File) || typeof bucketName !== "string" || !ALLOWED_BUCKETS.includes(bucketName)) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }
    if ((bucketName === "project_thumbnails" || bucketName === "portraits") && !file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Only image files allowed" }, { status: 400 });
    }
    if ((bucketName === "resumes" || bucketName === "transcripts") && file.type !== "application/pdf") {
      return NextResponse.json({ message: "Only PDF files allowed" }, { status: 400 });
    }
    if (file.size > MAX_STORED_FILE_BYTES) {
      return NextResponse.json({ message: "Files must be 1 MB or smaller." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${user.id}-${randomUUID()}-${sanitizeFilename(file.name)}`;
    const category = bucketName === "project_thumbnails" ? "thumbnail" : "core";
    const tier = await getUserSubscriptionTier(user.id);
    const reservation = await admin.rpc("reserve_storage_upload", {
      p_user_id: user.id,
      p_bucket: bucketName,
      p_object_path: path,
      p_category: category,
      p_byte_size: buffer.length,
      p_is_premium: tier !== "free",
    });
    if (reservation.error || !reservation.data) {
      const detail = reservation.error?.message ?? "";
      const message = detail.includes("thumbnail quota")
        ? "You have reached your stored thumbnail limit. Use an external HTTPS image or remove a stored thumbnail."
        : detail.includes("project storage quota")
          ? "Project storage has reached its 1 GB limit."
          : detail.includes("already in progress")
            ? "Another upload is still in progress. Please retry shortly."
            : "Unable to reserve storage for this upload.";
      return NextResponse.json({ message }, { status: 409 });
    }
    reservationId = reservation.data as string;

    const { error: uploadError } = await admin.storage.from(bucketName).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;
    uploaded = { bucket: bucketName, path };

    if (!await isAccountActive(user.id)) {
      throw new Error("Account deletion is in progress");
    }

    const { data: publicURL } = supabase.storage.from(bucketName).getPublicUrl(path);

    if (isDocumentBucket(bucketName)) {
      const field = DOCUMENT_FIELDS[bucketName];
      const { data: userData, error: selectError } = await supabase.from("users")
        .select(field).eq("id", user.id).single();
      if (selectError) throw selectError;
      const existingURL = (userData as DocumentURLRow)[field] ?? null;

      const { error: updateError } = await supabase.from("users")
        .update({ [field]: publicURL.publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      const { error: finalizeError } = await admin.rpc("finalize_storage_upload", { p_id: reservationId });
      if (finalizeError) {
        await supabase.from("users").update({ [field]: existingURL }).eq("id", user.id);
        throw finalizeError;
      }
      reservationId = null;
      uploaded = null;

      const oldObject = existingURL ? parseURL(existingURL) : null;
      if (oldObject && oldObject.parsedBucket === bucketName && isStorageObjectOwnedByUser(oldObject.parsedFilename, user.id)) {
        await removeObjectAndLedger(admin, oldObject.parsedBucket, oldObject.parsedFilename, existingURL!);
      }
      await refreshCachedUserInfo(supabase, user.id);
      return NextResponse.json({ publicURL: publicURL.publicUrl }, { status: 201 });
    }

    const { error: finalizeError } = await admin.rpc("finalize_storage_upload", { p_id: reservationId });
    if (finalizeError) throw finalizeError;
    reservationId = null;
    uploaded = null;
    return NextResponse.json({ publicURL: publicURL.publicUrl }, { status: 201 });
  } catch (error) {
    if (uploaded) await admin.storage.from(uploaded.bucket).remove([uploaded.path]);
    if (reservationId) await admin.from("storage_quota_ledger").delete().eq("id", reservationId);
    console.error(error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}

/** Saves an externally hosted core document without consuming Storage quota. */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = createAdminClient();
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;
    const body = await req.json() as { externalUrl?: unknown; bucketName?: unknown };
    if (typeof body.externalUrl !== "string" || typeof body.bucketName !== "string" ||
        !isDocumentBucket(body.bucketName) || !isSafeExternalUrl(body.externalUrl)) {
      return NextResponse.json({ message: "Use a valid external HTTPS URL." }, { status: 400 });
    }
    const field = DOCUMENT_FIELDS[body.bucketName];
    const { data, error: selectError } = await supabase.from("users")
      .select(field).eq("id", user.id).single();
    if (selectError) throw selectError;
    const existingURL = (data as DocumentURLRow)[field] ?? null;
    const { error: updateError } = await supabase.from("users")
      .update({ [field]: body.externalUrl }).eq("id", user.id);
    if (updateError) throw updateError;

    const oldObject = existingURL ? parseURL(existingURL) : null;
    if (oldObject && oldObject.parsedBucket === body.bucketName && isStorageObjectOwnedByUser(oldObject.parsedFilename, user.id)) {
      await removeObjectAndLedger(admin, oldObject.parsedBucket, oldObject.parsedFilename, existingURL!);
    }
    await refreshCachedUserInfo(supabase, user.id);
    return NextResponse.json({ publicURL: body.externalUrl }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unable to save external file." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = createAdminClient();
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;
    const publicURL = req.nextUrl.searchParams.get("publicURL");
    if (!publicURL) return NextResponse.json({ message: "Invalid input" }, { status: 400 });

    const object = parseURL(publicURL);
    if (!object) {
      if (!isSafeExternalUrl(publicURL)) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
      const fields = Object.values(DOCUMENT_FIELDS);
      const { data, error } = await supabase.from("users").select(fields.join(",")).eq("id", user.id).single();
      if (error) throw error;
      const field = fields.find((candidate) => (data as DocumentURLRow)[candidate] === publicURL);
      if (!field) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      const { error: updateError } = await supabase.from("users").update({ [field]: null })
        .eq("id", user.id).eq(field, publicURL);
      if (updateError) throw updateError;
      await refreshCachedUserInfo(supabase, user.id);
      return new NextResponse(null, { status: 204 });
    }

    if (!ALLOWED_BUCKETS.includes(object.parsedBucket) || !isStorageObjectOwnedByUser(object.parsedFilename, user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (object.parsedBucket === "project_thumbnails") {
      const { data: projects, error } = await supabase.from("projects").select("id")
        .eq("user_id", user.id).eq("thumbnail_url", publicURL);
      if (error) throw error;
      if (!projects?.length) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      const { error: updateError } = await supabase.from("projects").update({ thumbnail_url: null })
        .in("id", projects.map((project) => project.id)).eq("user_id", user.id).eq("thumbnail_url", publicURL);
      if (updateError) throw updateError;
    } else {
      if (!isDocumentBucket(object.parsedBucket)) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
      const field = DOCUMENT_FIELDS[object.parsedBucket];
      const { data, error } = await supabase.from("users").select(field).eq("id", user.id).single();
      if (error) throw error;
      if ((data as DocumentURLRow)[field] !== publicURL) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      const { error: updateError } = await supabase.from("users").update({ [field]: null })
        .eq("id", user.id).eq(field, publicURL);
      if (updateError) throw updateError;
    }

    await removeObjectAndLedger(admin, object.parsedBucket, object.parsedFilename, publicURL);
    await refreshCachedUserInfo(supabase, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unable to delete file." }, { status: 500 });
  }
}
