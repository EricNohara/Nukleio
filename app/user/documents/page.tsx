"use client";

import { useState } from "react";

import FileDisplayBox from "@/app/components/FileDisplayBox/FileDisplayBox";
import FileUploadBox from "@/app/components/FileUploadBox/FileUploadBox";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import { IButton } from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import { useUser } from "@/app/context/UserProvider";
import { compressImage, compressPDF } from "@/utils/file-upload/compress";
import { uploadFile } from "@/utils/file-upload/upload";

import styles from "./DocumentsPage.module.css";

export default function DocumentsPage() {
  const [isEditing, setIsEditing] = useState({
    portrait_url: false,
    resume_url: false,
    transcript_url: false
  })
  const [docs, setDocs] = useState<{ portrait: File | null, resume: File | null, transcript: File | null }>({
    portrait: null,
    resume: null,
    transcript: null
  })
  const { state, dispatch } = useUser();

  const handleEdit = (url: string | undefined) => {
    switch (url) {
      case "portrait_url":
        setIsEditing({ ...isEditing, portrait_url: true })
        break;
      case "resume_url":
        setIsEditing({ ...isEditing, resume_url: true })
        break;
      case "transcript_url":
        setIsEditing({ ...isEditing, transcript_url: true })
        break;
      default:
        break;
    }
  }

  const handleDelete = async (url: string | undefined, docType: string | undefined) => {
    try {
      if (!url || !docType) throw new Error("Invalid url or doc type");

      const res = await fetch(`/api/internal/storage?publicURL=${url}`, { method: "DELETE" });

      if (res.status === 204) {
        alert("Successfully deleted document");
      } else {
        const data = await res.json();
        throw new Error(data.message);
      }

      // update cached state
      dispatch({ type: "DELETE_DOCUMENT", payload: { docType: docType } });
    } catch (err) {
      console.error(err);
      alert(err);
    }
  }

  const handleUpload = async () => {
    try {
      // upload each file and update cached state + state variables
      if (docs.portrait) {
        const compressedPortrait = await compressImage(docs.portrait);
        const publicPortraitUrl = await uploadFile(compressedPortrait, "portraits");
        dispatch({ type: "UPDATE_DOCUMENT", payload: { url: publicPortraitUrl, docType: "portrait_url" } });
        setIsEditing({ ...isEditing, portrait_url: false });
        setDocs({ ...docs, portrait: null });
      }
      if (docs.resume) {
        const compressedResume = await compressPDF(docs.resume);
        const publicResumeUrl = await uploadFile(compressedResume, "resumes");
        dispatch({ type: "UPDATE_DOCUMENT", payload: { url: publicResumeUrl, docType: "resume_url" } });
        setIsEditing({ ...isEditing, resume_url: false });
        setDocs({ ...docs, resume: null });
      }
      if (docs.transcript) {
        const compressedTranscript = await compressPDF(docs.transcript);
        const publicTranscriptUrl = await uploadFile(compressedTranscript, "transcripts");
        dispatch({ type: "UPDATE_DOCUMENT", payload: { url: publicTranscriptUrl, docType: "transcript_url" } });
        setIsEditing({ ...isEditing, transcript_url: false });
        setDocs({ ...docs, transcript: null });
      }
    } catch (error) {
      console.error(error);
      alert(error);
    }
  }

  const handleFileSelect = (file: File, docType: string) => {
    switch (docType) {
      case "portrait_url":
        setDocs({ ...docs, portrait: file });
        break;
      case "resume_url":
        setDocs({ ...docs, resume: file });
        break;
      case "transcript_url":
        setDocs({ ...docs, transcript: file });
        break;
      default:
        break;
    }
  }

  const buttonOne: IButton = {
    name: "Save Documents",
    onClick: handleUpload
  }

  return (
    <PageContentWrapper>
      <PageContentHeader title="Documents" buttonOne={buttonOne} />
      <div className={styles.fileUploadBoxContainer}>
        {
          state.portrait_url && !isEditing.portrait_url ?
            <FileDisplayBox
              imageUrl={state.portrait_url}
              alt={state.name || "Your Portrait Display"}
              uploadedItemName="Profile Picture"
              onEdit={handleEdit}
              onDelete={handleDelete}
              docType="portrait_url"
            /> :
            isEditing.portrait_url ?
              <FileUploadBox
                label="Edit Profile Picture"
                accepts="image/*"
                uploadInstructions="Upload image files of up to 50 MB and click save documents"
                isEditView={isEditing.portrait_url}
                onExitEditView={() => { setIsEditing({ ...isEditing, portrait_url: false }); setDocs({ ...docs, portrait: null }) }}
                onFileSelect={handleFileSelect}
                docType="portrait_url"
              /> :
              <FileUploadBox
                label="Upload Profile Picture"
                accepts="image/*"
                uploadInstructions="Upload image files of up to 50 MB and click save documents"
                onFileSelect={handleFileSelect}
                docType="portrait_url"
              />
        }
        {
          state.resume_url && !isEditing.resume_url ?
            <FileDisplayBox
              pdfUrl={state.resume_url}
              uploadedItemName="Resume"
              onEdit={handleEdit}
              onDelete={handleDelete}
              docType="resume_url"
            /> :
            isEditing.resume_url ?
              <FileUploadBox
                label="Edit Resume File"
                accepts=".pdf"
                uploadInstructions="Upload PDF files of up to 50 MB and click save documents"
                isEditView={isEditing.resume_url}
                onExitEditView={() => { setIsEditing({ ...isEditing, resume_url: false }); setDocs({ ...docs, resume: null }) }}
                onFileSelect={handleFileSelect}
                docType="resume_url"
              /> :
              <FileUploadBox
                label="Upload Resume File"
                accepts=".pdf"
                uploadInstructions="Upload PDF files of up to 50 MB and click save documents"
                onFileSelect={handleFileSelect}
                docType="resume_url"
              />
        }
        {
          state.transcript_url && !isEditing.transcript_url ?
            <FileDisplayBox
              pdfUrl={state.transcript_url}
              uploadedItemName="Transcript"
              onEdit={handleEdit}
              onDelete={handleDelete}
              docType="transcript_url"
            /> :
            isEditing.transcript_url ?
              <FileUploadBox
                label="Edit Transcript File"
                accepts=".pdf"
                uploadInstructions="Upload PDF files of up to 50 MB and click save documents"
                isEditView={isEditing.transcript_url}
                onExitEditView={() => { setIsEditing({ ...isEditing, transcript_url: false }); setDocs({ ...docs, transcript: null }) }}
                onFileSelect={handleFileSelect}
                docType="transcript_url"
              /> :
              <FileUploadBox
                label="Upload Transcript File"
                accepts=".pdf"
                uploadInstructions="Upload PDF files of up to 50 MB and click save documents"
                onFileSelect={handleFileSelect}
                docType="transcript_url"
              />
        }
      </div>

    </PageContentWrapper>
  );
}
