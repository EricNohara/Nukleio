import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { isAccountActive } from "@/utils/accountDeletion/status";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { refreshCachedUserInfo } from "@/utils/cachedUserInfo/refreshCachedUserInfo";
import parseURL, {
  isStorageObjectOwnedByUser,
} from "@/utils/general/parseURL";
import { createAdminClient } from "@/utils/supabase/server";

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser to handle multipart form data manually
  },
};

const ALLOWED_BUCKETS = [
  "project_thumbnails",
  "portraits",
  "resumes",
  "transcripts",
];
const MAX_STORED_FILE_BYTES = 1024 * 1024;
// Multipart bodies include field and boundary overhead. This early guard keeps
// oversized bodies out of Next's formData() buffering path.
const MAX_MULTIPART_BODY_BYTES = MAX_STORED_FILE_BYTES + 64 * 1024;

const DOCUMENT_FIELDS = {
  portraits: "portrait_url",
  resumes: "resume_url",
  transcripts: "transcript_url",
} as const;

type DocumentBucket = keyof typeof DOCUMENT_FIELDS;
type DocumentField = (typeof DOCUMENT_FIELDS)[DocumentBucket];
type DocumentURLRow = Partial<Record<DocumentField, string | null>>;

function isDocumentBucket(bucketName: string): bucketName is DocumentBucket {
  return bucketName in DOCUMENT_FIELDS;
}

function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(-160);

  return sanitized || "upload";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const serviceRoleSupabase = createAdminClient();
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BODY_BYTES) {
      return NextResponse.json(
        { message: "Files must be 1 MB or smaller." },
        { status: 413 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucketName = formData.get("bucketName") as string | null;

    if (!file || !bucketName || !ALLOWED_BUCKETS.includes(bucketName)) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    if (
      (bucketName === "project_thumbnails" || bucketName === "portraits") &&
      !file.type.startsWith("image/")
    ) {
      return NextResponse.json(
        { message: "Only image files allowed" },
        { status: 400 }
      );
    } else if (
      (bucketName === "resumes" || bucketName === "transcripts") &&
      file.type !== "application/pdf"
    ) {
      return NextResponse.json(
        { message: "Only PDF files allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_STORED_FILE_BYTES) {
      return NextResponse.json(
        { message: "Files must be 1 MB or smaller." },
        { status: 413 },
      );
    }

    // upload to supabase
    const fileContent = await file.arrayBuffer();
    const buffer = Buffer.from(fileContent);
    const filepath = `${user.id}-${randomUUID()}-${sanitizeFilename(file.name)}`;

    const { error: uploadError } = await serviceRoleSupabase.storage
      .from(bucketName)
      .upload(filepath, buffer, {
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // An upload that began immediately before account deletion can finish
    // after the deletion inventory was taken. Fail closed and roll it back.
    if (!await isAccountActive(user.id)) {
      await serviceRoleSupabase.storage.from(bucketName).remove([filepath]);
      return NextResponse.json(
        { message: "Account deletion is in progress" },
        { status: 423 },
      );
    }

    // get the public URL
    const { data: publicURL } = await supabase.storage
      .from(bucketName)
      .getPublicUrl(filepath);

    if (bucketName !== "project_thumbnails") {
      if (!isDocumentBucket(bucketName)) {
        throw new Error("Unsupported document bucket");
      }

      const documentField = DOCUMENT_FIELDS[bucketName];
      const updateData = { [documentField]: publicURL.publicUrl };

      // check if user already has a document - if so delete the document and its reference
      const { data: userData, error: existsError } = await supabase
        .from("users")
        .select(documentField)
        .eq("id", user.id)
        .single();

      if (existsError) {
        // This exact path was generated and uploaded for the authenticated user
        // in this request, so it is safe to roll back before a DB reference exists.
        await serviceRoleSupabase.storage.from(bucketName).remove([filepath]);
        throw existsError;
      }

      const existingURL = (userData as DocumentURLRow)[documentField] ?? null;

      // add it to the user's row
      const { error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user?.id);

      if (updateError) {
        await serviceRoleSupabase.storage.from(bucketName).remove([filepath]);
        throw updateError;
      }

      // delete old document after the new doc successfully saves
      if (existingURL !== "" && existingURL) {
        // The URL came from the authenticated user's DB row. Also enforce the
        // server-issued path namespace before using service-role deletion.
        const existingObject = parseURL(existingURL);
        if (
          existingObject &&
          existingObject.parsedBucket === bucketName &&
          isStorageObjectOwnedByUser(
            existingObject.parsedFilename,
            user.id,
          )
        ) {
          const { error: removeError } = await serviceRoleSupabase.storage
            .from(existingObject.parsedBucket)
            .remove([existingObject.parsedFilename]);

          if (removeError) throw removeError;
        }
      }

      // update the user info cache
      await refreshCachedUserInfo(supabase, user.id);

      return NextResponse.json(
        { publicURL: publicURL.publicUrl },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { publicURL: publicURL.publicUrl },
        { status: 201 }
      );
    }
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const serviceRoleSupabase = createAdminClient();
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const publicURL: string | null = req.nextUrl.searchParams.get("publicURL");
    if (!publicURL) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const storageObject = parseURL(publicURL);

    if (
      !storageObject ||
      !ALLOWED_BUCKETS.includes(storageObject.parsedBucket)
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { parsedBucket, parsedFilename } = storageObject;

    if (!isStorageObjectOwnedByUser(parsedFilename, user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (parsedBucket === "project_thumbnails") {
      // The object must be referenced by a project owned by this user. The path
      // namespace check above prevents a poisoned DB URL from authorizing a
      // cross-tenant delete.
      const { data: ownedProjects, error: ownershipError } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .eq("thumbnail_url", publicURL);

      if (ownershipError) throw ownershipError;
      if (!ownedProjects || ownedProjects.length === 0) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      const { error: removeError } = await serviceRoleSupabase.storage
        .from(parsedBucket)
        .remove([parsedFilename]);

      if (removeError) throw removeError;

      const projectIDs = ownedProjects.map((project) => project.id);
      const { error: updateError } = await supabase
        .from("projects")
        .update({ thumbnail_url: null })
        .in("id", projectIDs)
        .eq("user_id", user.id)
        .eq("thumbnail_url", publicURL);

      if (updateError) throw updateError;

      await refreshCachedUserInfo(supabase, user.id);

      return new NextResponse(null, { status: 204 });
    } else {
      if (!isDocumentBucket(parsedBucket)) {
        return NextResponse.json({ message: "Invalid input" }, { status: 400 });
      }

      const documentField = DOCUMENT_FIELDS[parsedBucket];
      const { data: userData, error: ownershipError } = await supabase
        .from("users")
        .select(documentField)
        .eq("id", user.id)
        .single();

      if (ownershipError) throw ownershipError;
      if ((userData as DocumentURLRow)[documentField] !== publicURL) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ [documentField]: null })
        .eq("id", user.id)
        .eq(documentField, publicURL);

      if (updateError) throw updateError;

      const { error } = await serviceRoleSupabase.storage
        .from(parsedBucket)
        .remove([parsedFilename]);

      if (error) throw error;

      // update the user info cache
      await refreshCachedUserInfo(supabase, user.id);

      return new NextResponse(null, { status: 204 });
    }
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
