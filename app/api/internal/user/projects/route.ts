import { NextRequest, NextResponse } from "next/server";

import { IProjectInput } from "@/app/interfaces/IProject";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { refreshCachedUserInfo } from "@/utils/cachedUserInfo/refreshCachedUserInfo";
import parseURL, {
  isStorageObjectOwnedByUser,
} from "@/utils/general/parseURL";
import { createAdminClient } from "@/utils/supabase/server";

function isOwnedProjectThumbnail(url: string, userID: string): boolean {
  const storageObject = parseURL(url);

  return Boolean(
    storageObject &&
      storageObject.parsedBucket === "project_thumbnails" &&
      isStorageObjectOwnedByUser(storageObject.parsedFilename, userID),
  );
}

function isSafeExternalThumbnail(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const limit = req.nextUrl.searchParams.get("limit");
    const projectID = req.nextUrl.searchParams.get("projectID");

    if (limit && projectID) {
      return NextResponse.json(
        { message: "Limit and projectID cannot both be specified" },
        { status: 400 },
      );
    }

    if (limit) {
      const limitNum = parseInt(limit);

      if (isNaN(limitNum) || limitNum <= 0) {
        return NextResponse.json(
          { message: "Limit parameter must be greater than 0" },
          { status: 400 },
        );
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .limit(limitNum);

      if (error) throw error;

      return NextResponse.json(data, { status: 200 });
    }

    if (projectID) {
      const { data, error } = await supabase
        .from("projects")
        .select()
        .eq("user_id", user.id)
        .eq("id", projectID);

      if (error) throw error;

      return NextResponse.json(data, { status: 200 });
    }

    const { data, error } = await supabase
      .from("projects")
      .select()
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const sentProject: IProjectInput = await req.json();

    if (!sentProject || !sentProject.name || !sentProject.description) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    if (
      sentProject.thumbnail_url &&
      !isOwnedProjectThumbnail(sentProject.thumbnail_url, user.id) &&
      !isSafeExternalThumbnail(sentProject.thumbnail_url)
    ) {
      return NextResponse.json(
        { message: "Invalid project thumbnail" },
        { status: 400 },
      );
    }

    const projectData = {
      ...sentProject,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert(projectData)
      .select("id")
      .single();

    if (error) throw error;

    if (sentProject.thumbnail_url && isOwnedProjectThumbnail(sentProject.thumbnail_url, user.id)) {
      const object = parseURL(sentProject.thumbnail_url)!;
      const admin = createAdminClient();
      const claim = await admin.rpc("claim_project_thumbnail", {
        p_user_id: user.id,
        p_bucket: object.parsedBucket,
        p_object_path: object.parsedFilename,
      });
      if (claim.error || claim.data !== true) {
        await supabase.from("projects").delete().eq("id", data.id).eq("user_id", user.id);
        throw claim.error ?? new Error("Project thumbnail upload was not reserved");
      }
    }

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "Successfully created project", id: data.id },
      { status: 201 },
    );
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const projectID = req.nextUrl.searchParams.get("projectID");
    if (!projectID) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, thumbnail_url")
      .eq("id", projectID)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    if (project.thumbnail_url) {
      if (isOwnedProjectThumbnail(project.thumbnail_url, user.id)) {
        const storageObject = parseURL(project.thumbnail_url)!;
        const admin = createAdminClient();
        const { error: removeError } = await admin.storage
          .from(storageObject.parsedBucket)
          .remove([storageObject.parsedFilename]);

        if (removeError) {
          const queued = await admin.from("storage_deletion_queue")
            .insert({ object_url: project.thumbnail_url });
          if (queued.error) throw removeError;
        } else {
          const ledger = await admin.from("storage_quota_ledger").delete()
            .eq("bucket", storageObject.parsedBucket)
            .eq("object_path", storageObject.parsedFilename);
          if (ledger.error) throw ledger.error;
        }
      } else {
        // Never follow a malformed or foreign DB reference with service-role
        // credentials. The project can still be deleted safely.
        console.warn("Skipped unowned project thumbnail during project delete");
      }
    }

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectID)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const {
      prevProjectID,
      updatedProject,
    }: {
      prevProjectID: string;
      updatedProject: IProjectInput;
    } = await req.json();

    if (
      !updatedProject ||
      !prevProjectID ||
      !updatedProject.name ||
      !updatedProject.description
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    if (
      updatedProject.thumbnail_url &&
      !isOwnedProjectThumbnail(updatedProject.thumbnail_url, user.id) &&
      !isSafeExternalThumbnail(updatedProject.thumbnail_url)
    ) {
      return NextResponse.json(
        { message: "Invalid project thumbnail" },
        { status: 400 },
      );
    }

    const { data: existingProject, error: existingProjectError } = await supabase
      .from("projects")
      .select("id, thumbnail_url")
      .eq("id", prevProjectID)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingProjectError) throw existingProjectError;
    if (!existingProject) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const projectData = {
      ...updatedProject,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("projects")
      .update(projectData)
      .eq("id", prevProjectID)
      .eq("user_id", user.id);

    if (error) throw error;

    if (updatedProject.thumbnail_url && isOwnedProjectThumbnail(updatedProject.thumbnail_url, user.id)) {
      const object = parseURL(updatedProject.thumbnail_url)!;
      const admin = createAdminClient();
      const claim = await admin.rpc("claim_project_thumbnail", {
        p_user_id: user.id,
        p_bucket: object.parsedBucket,
        p_object_path: object.parsedFilename,
      });
      if (claim.error || claim.data !== true) {
        await supabase.from("projects").update({ thumbnail_url: existingProject.thumbnail_url })
          .eq("id", prevProjectID).eq("user_id", user.id);
        throw claim.error ?? new Error("Project thumbnail upload was not reserved");
      }
    }

    if (
      existingProject.thumbnail_url &&
      existingProject.thumbnail_url !== updatedProject.thumbnail_url &&
      isOwnedProjectThumbnail(existingProject.thumbnail_url, user.id)
    ) {
      const storageObject = parseURL(existingProject.thumbnail_url)!;
      const admin = createAdminClient();
      const { error: removeError } = await admin.storage
        .from(storageObject.parsedBucket)
        .remove([storageObject.parsedFilename]);

      if (removeError) {
        console.error(
          `Failed to remove replaced project thumbnail: ${removeError.message}`,
        );
        const queued = await admin.from("storage_deletion_queue")
          .insert({ object_url: existingProject.thumbnail_url });
        if (queued.error) console.error(`Failed to queue thumbnail cleanup: ${queued.error.message}`);
      } else {
        const ledger = await admin.from("storage_quota_ledger").delete()
          .eq("bucket", storageObject.parsedBucket)
          .eq("object_path", storageObject.parsedFilename);
        if (ledger.error) console.error(`Failed to release thumbnail quota: ${ledger.error.message}`);
      }
    }

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "Successfully updated project" },
      { status: 200 },
    );
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
