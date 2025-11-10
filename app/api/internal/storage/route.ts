import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import parseURL from "@/utils/general/parseURL";
import { createServiceRoleClient } from "@/utils/supabase/server";

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const serviceRoleSupabase = createServiceRoleClient();
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucketName = formData.get("bucketName") as string | null;

    if (!file || !bucketName || !ALLOWED_BUCKETS.includes(bucketName)) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Only image files allowed" },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      return NextResponse.json({ message: "File too large" }, { status: 400 });
    }

    // upload to supabase
    const fileContent = await file.arrayBuffer();
    const buffer = Buffer.from(fileContent);
    const filepath =
      bucketName === "project_thumbnails"
        ? `${user.id}-${Date.now()}-${file.name}`
        : `${user.id}-${file.name}`;

    const { error: uploadError } = await serviceRoleSupabase.storage
      .from(bucketName)
      .upload(filepath, buffer, {
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // get the public URL
    const { data: publicURL } = await supabase.storage
      .from(bucketName)
      .getPublicUrl(filepath);

    if (bucketName !== "project_thumbnails") {
      let documentField: string;
      let updateData;
      if (bucketName === "portraits") {
        documentField = "portrait_url";
        updateData = { portrait_url: publicURL.publicUrl };
      } else if (bucketName === "resumes") {
        documentField = "resume_url";
        updateData = { resume_url: publicURL.publicUrl };
      } else {
        documentField = "transcript_url";
        updateData = { transcript_url: publicURL.publicUrl };
      }

      // check if user already has a document - if so delete the document and its reference
      const { data: userData, error: existsError } = await supabase
        .from("users")
        .select(documentField)
        .eq("id", user.id);

      if (existsError) {
        // if error checking if url exists, delete from storage
        await serviceRoleSupabase.storage.from(bucketName).remove([file.name]);
        throw existsError;
      }

      const existingURLObject = userData[0];
      const existingURL = Object.values(existingURLObject)[0] as string;

      // add it to the user's row
      const { error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user?.id);

      if (updateError) {
        await serviceRoleSupabase.storage.from(bucketName).remove([file.name]);
        throw updateError;
      }

      // delete old document after the new doc successfully saves
      if (existingURL !== "" && existingURL) {
        // user already has a document so need to delete it
        const { parsedBucket, parsedFilename } = parseURL(existingURL);

        await serviceRoleSupabase.storage
          .from(parsedBucket)
          .remove([parsedFilename]);
      }

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
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const serviceRoleSupabase = createServiceRoleClient();
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const publicURL: string | null = req.nextUrl.searchParams.get("publicURL");
    if (!publicURL) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { parsedBucket, parsedFilename } = parseURL(publicURL);

    if (
      !parsedBucket ||
      !parsedFilename ||
      !ALLOWED_BUCKETS.includes(parsedBucket)
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    if (parsedBucket === "project_thumbnails") {
      // if deleting project thumbnail, just need to delete from storage
      const { error } = await serviceRoleSupabase.storage
        .from(parsedBucket)
        .remove([parsedFilename]);

      if (error) throw error;

      return new NextResponse(null, { status: 204 });
    } else {
      // try to delete from DB
      const userData =
        parsedBucket === "portraits"
          ? { portrait_url: null }
          : parsedBucket === "resumes"
          ? { resume_url: null }
          : { transcript_url: null };

      const { error: updateError } = await supabase
        .from("users")
        .update(userData)
        .eq("id", user?.id);

      if (updateError) throw updateError;

      const { error } = await serviceRoleSupabase.storage
        .from(parsedBucket)
        .remove([parsedFilename]);

      if (error) throw error;

      return new NextResponse(null, { status: 204 });
    }
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
