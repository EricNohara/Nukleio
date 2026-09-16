"use client";

import { File } from "lucide-react";
import { useState } from "react";

import FileDisplayBox from "@/app/components/FileDisplayBox/FileDisplayBox";
import FileUploadBox from "@/app/components/FileUploadBox/FileUploadBox";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import { IButton } from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import { useToast } from "@/app/context/ToastProvider";
import { useUser } from "@/app/context/UserProvider";
import { compressStoredFile } from "@/utils/file-upload/compressWithAgent";
import { saveExternalFileUrl, uploadFile } from "@/utils/file-upload/upload";

import styles from "./DocumentsPage.module.css";

export default function DocumentsPage() {
  const [isEditing, setIsEditing] = useState({
    portrait_url: false,
    resume_url: false,
    transcript_url: false
  });
  const [docs, setDocs] = useState<{ portrait: File | null, resume: File | null, transcript: File | null }>({
    portrait: null,
    resume: null,
    transcript: null
  });
  const [externalDocs, setExternalDocs] = useState({ portrait: "", resume: "", transcript: "" });
  const { state, dispatch } = useUser();
  const toast = useToast();

  const handleEdit = (url: string | undefined) => {
    switch (url) {
      case "portrait_url":
        setIsEditing({ ...isEditing, portrait_url: true });
        break;
      case "resume_url":
        setIsEditing({ ...isEditing, resume_url: true });
        break;
      case "transcript_url":
        setIsEditing({ ...isEditing, transcript_url: true });
        break;
      default:
        break;
    }
  };

  const handleDelete = async (url: string | undefined, docType: string | undefined) => {
    try {
      if (!url || !docType) throw new Error("Invalid url or doc type");

      const res = await fetch(
        `/api/internal/storage?publicURL=${encodeURIComponent(url)}`,
        { method: "DELETE" },
      );

      if (res.status !== 204) {
        const data = await res.json();
        throw new Error(data.message);
      }

      // update cached state
      dispatch({ type: "DELETE_DOCUMENT", payload: { docType: docType } });
      toast.success("Success", "Successfully deleted your document.");
    } catch {
      toast.error("Error", "Error deleting your document.");
    }
  };

  const handleUpload = async () => {
    try {
      // upload each file and update cached state + state variables
      if (docs.portrait) {
        const compressedPortrait = await compressStoredFile(docs.portrait, "portrait");
        const publicPortraitUrl = await uploadFile(compressedPortrait, "portraits");
        dispatch({ type: "UPDATE_DOCUMENT", payload: { url: publicPortraitUrl, docType: "portrait_url" } });
        setIsEditing({ ...isEditing, portrait_url: false });
        setDocs({ ...docs, portrait: null });
      } else if (externalDocs.portrait) {
        const url = await saveExternalFileUrl(externalDocs.portrait, "portraits");
        dispatch({ type: "UPDATE_DOCUMENT", payload: { url, docType: "portrait_url" } });
        setExternalDocs((current) => ({ ...current, portrait: "" }));
        setIsEditing((current) => ({ ...current, portrait_url: false }));
      }
      if (docs.resume) {
        const compressedResume = await compressStoredFile(docs.resume, "resume");
        const publicResumeUrl = await uploadFile(compressedResume, "resumes");
        dispatch({ type: "UPDATE_DOCUMENT", payload: { url: publicResumeUrl, docType: "resume_url" } });
        setIsEditing({ ...isEditing, resume_url: false });
        setDocs({ ...docs, resume: null });
      } else if (externalDocs.resume) {
        const url = await saveExternalFileUrl(externalDocs.resume, "resumes");
        dispatch({ type: "UPDATE_DOCUMENT", payload: { url, docType: "resume_url" } });
        setExternalDocs((current) => ({ ...current, resume: "" }));
        setIsEditing((current) => ({ ...current, resume_url: false }));
      }
      if (docs.transcript) {
        const compressedTranscript = await compressStoredFile(docs.transcript, "transcript");
        const publicTranscriptUrl = await uploadFile(compressedTranscript, "transcripts");
        dispatch({ type: "UPDATE_DOCUMENT", payload: { url: publicTranscriptUrl, docType: "transcript_url" } });
        setIsEditing({ ...isEditing, transcript_url: false });
        setDocs({ ...docs, transcript: null });
      } else if (externalDocs.transcript) {
        const url = await saveExternalFileUrl(externalDocs.transcript, "transcripts");
        dispatch({ type: "UPDATE_DOCUMENT", payload: { url, docType: "transcript_url" } });
        setExternalDocs((current) => ({ ...current, transcript: "" }));
        setIsEditing((current) => ({ ...current, transcript_url: false }));
      }

      toast.success("Success", "Successfully uploaded your documents.");
    } catch (err) {
      const error = err as Error;
      toast.error("Error", error.message ?? "Failed to upload your documents. Please try again.");
    }
  };

  const handleFileSelect = (file: File, docType: string) => {
    switch (docType) {
      case "portrait_url":
        setDocs((current) => ({ ...current, portrait: file }));
        setExternalDocs((current) => ({ ...current, portrait: "" }));
        toast.info("Info", "Click save documents button to save your portrait.");
        break;
      case "resume_url":
        setDocs((current) => ({ ...current, resume: file }));
        setExternalDocs((current) => ({ ...current, resume: "" }));
        toast.info("Info", "Click save documents button to save your resume.");
        break;
      case "transcript_url":
        setDocs((current) => ({ ...current, transcript: file }));
        setExternalDocs((current) => ({ ...current, transcript: "" }));
        toast.info("Info", "Click save documents button to save your transcript.");
        break;
      default:
        break;
    }
  };

  const handleExternalSelect = (url: string, docType: string) => {
    const key = docType === "portrait_url" ? "portrait" : docType === "resume_url" ? "resume" : "transcript";
    setExternalDocs((current) => ({ ...current, [key]: url }));
    if (url) {
      setDocs((current) => ({ ...current, [key]: null }));
      toast.info("External link selected", "Click save documents to use this externally hosted file.");
    }
  };

  const buttonOne: IButton = {
    name: "Save Documents",
    onClick: handleUpload,
    isAsync: true
  };

  // only render save button if needed
  const shouldRenderButton = () => {
    return !state.portrait_url || !state.resume_url || !state.transcript_url || isEditing.portrait_url || isEditing.resume_url || isEditing.transcript_url;
  };

  return (
    <PageContentWrapper>
      <PageContentHeader title="Documents" buttonOne={shouldRenderButton() ? buttonOne : undefined} icon={File} />
      <div className={styles.fileUploadBoxContainer}>
        {
          state.portrait_url && !isEditing.portrait_url ?
            <FileDisplayBox
              imageUrl={state.portrait_url}
              alt={state.name || "Your Portrait Display"}
              uploadedItemName="Profile Picture"
              onEdit={handleEdit}
              onDelete={() => handleDelete(state.portrait_url ?? "", "portrait_url")}
              docType="portrait_url"
            /> :
            isEditing.portrait_url ?
              <FileUploadBox
                label="Edit Profile Picture"
                accepts="image/*"
                uploadInstructions="Upload an image up to 50 MB; it will be compressed to fit, or use an external HTTPS link"
                isEditView={isEditing.portrait_url}
                onExitEditView={() => { setIsEditing({ ...isEditing, portrait_url: false }); setDocs({ ...docs, portrait: null }); }}
                onFileSelect={handleFileSelect}
                docType="portrait_url"
                allowExternalUrl
                onExternalUrlSelect={handleExternalSelect}
                initialPreviewUrl={externalDocs.portrait || null}
              /> :
              <FileUploadBox
                label="Upload Profile Picture"
                accepts="image/*"
                uploadInstructions="Upload an image up to 50 MB; it will be compressed to fit, or use an external HTTPS link"
                onFileSelect={handleFileSelect}
                docType="portrait_url"
                allowExternalUrl
                onExternalUrlSelect={handleExternalSelect}
              />
        }
        {
          state.resume_url && !isEditing.resume_url ?
            <FileDisplayBox
              pdfUrl={state.resume_url}
              uploadedItemName="Resume"
              onEdit={handleEdit}
              onDelete={() => handleDelete(state.resume_url ?? "", "resume_url")}
              docType="resume_url"
            /> :
            isEditing.resume_url ?
              <FileUploadBox
                label="Edit Resume File"
                accepts=".pdf"
                uploadInstructions="Upload a PDF up to 50 MB; it will be compressed to fit, or use an external HTTPS link"
                isEditView={isEditing.resume_url}
                onExitEditView={() => { setIsEditing({ ...isEditing, resume_url: false }); setDocs({ ...docs, resume: null }); }}
                onFileSelect={handleFileSelect}
                docType="resume_url"
                allowExternalUrl
                onExternalUrlSelect={handleExternalSelect}
                initialPreviewUrl={externalDocs.resume || null}
              /> :
              <FileUploadBox
                label="Upload Resume File"
                accepts=".pdf"
                uploadInstructions="Upload a PDF up to 50 MB; it will be compressed to fit, or use an external HTTPS link"
                onFileSelect={handleFileSelect}
                docType="resume_url"
                allowExternalUrl
                onExternalUrlSelect={handleExternalSelect}
              />
        }
        {
          state.transcript_url && !isEditing.transcript_url ?
            <FileDisplayBox
              pdfUrl={state.transcript_url}
              uploadedItemName="Transcript"
              onEdit={handleEdit}
              onDelete={() => handleDelete(state.transcript_url ?? "", "transcript_url")}
              docType="transcript_url"
            /> :
            isEditing.transcript_url ?
              <FileUploadBox
                label="Edit Transcript File"
                accepts=".pdf"
                uploadInstructions="Upload a PDF up to 50 MB; it will be compressed to fit, or use an external HTTPS link"
                isEditView={isEditing.transcript_url}
                onExitEditView={() => { setIsEditing({ ...isEditing, transcript_url: false }); setDocs({ ...docs, transcript: null }); }}
                onFileSelect={handleFileSelect}
                docType="transcript_url"
                allowExternalUrl
                onExternalUrlSelect={handleExternalSelect}
                initialPreviewUrl={externalDocs.transcript || null}
              /> :
              <FileUploadBox
                label="Upload Transcript File"
                accepts=".pdf"
                uploadInstructions="Upload a PDF up to 50 MB; it will be compressed to fit, or use an external HTTPS link"
                onFileSelect={handleFileSelect}
                docType="transcript_url"
                allowExternalUrl
                onExternalUrlSelect={handleExternalSelect}
              />
        }
      </div>
    </PageContentWrapper>
  );
}
