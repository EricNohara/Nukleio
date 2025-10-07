"use client";

import { useState } from "react";

import FileDisplayBox from "@/app/components/FileDisplayBox/FileDisplayBox";
import FileUploadBox from "@/app/components/FileUploadBox/FileUploadBox";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import { IButton } from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import { useUser } from "@/app/context/UserProvider";

// import DocumentsList from "./documents-list";
import styles from "./DocumentsPage.module.css";

export default function DocumentsPage() {
  const [isEditing, setIsEditing] = useState({
    portrait_url: false,
    resume_url: false,
    transcript_url: false
  })
  const { state, dispatch } = useUser();

  const buttonOne: IButton = {
    name: "Save Documents",
    onClick: () => { },
  }

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

  const handleFileSelect = (file: File) => { console.log("Selected file:", file) }

  return (
    <PageContentWrapper>
      <PageContentHeader title="Documents" buttonOne={buttonOne} />
      {/* <DocumentsList user={user} /> */}
      <div className={styles.fileUploadBoxContainer}>
        {
          state.portrait_url && !isEditing.portrait_url ?
            <FileDisplayBox
              imageUrl={state.portrait_url}
              alt={state.name || "Your Portrait Display"}
              uploadedItemName="Profile Picture"
              onEdit={handleEdit}
              onDelete={handleDelete}
            /> :
            isEditing.portrait_url ?
              <FileUploadBox
                label="Edit Profile Picture"
                accepts="image/*"
                uploadInstructions="Upload image files of up to 50 MB and click save documents"
                isEditView={isEditing.portrait_url}
                onExitEditView={() => setIsEditing({ ...isEditing, portrait_url: false })}
                onFileSelect={handleFileSelect}
              /> :
              <FileUploadBox
                label="Upload Profile Picture"
                accepts="image/*"
                uploadInstructions="Upload image files of up to 50 MB and click save documents"
                onFileSelect={handleFileSelect}
              />
        }
        {
          state.resume_url && !isEditing.resume_url ?
            <FileDisplayBox
              pdfUrl={state.resume_url}
              uploadedItemName="Resume"
              onEdit={handleEdit}
              onDelete={handleDelete}
            /> :
            isEditing.resume_url ?
              <FileUploadBox
                label="Edit Resume File"
                accepts=".pdf"
                uploadInstructions="Upload PDF files of up to 50 MB and click save documents"
                isEditView={isEditing.resume_url}
                onExitEditView={() => setIsEditing({ ...isEditing, resume_url: false })}
                onFileSelect={handleFileSelect}
              /> :
              <FileUploadBox
                label="Upload Resume File"
                accepts=".pdf"
                uploadInstructions="Upload PDF files of up to 50 MB and click save documents"
                onFileSelect={(file) => console.log("Selected file:", file)}
              />
        }
        {
          state.transcript_url && !isEditing.transcript_url ?
            <FileDisplayBox
              pdfUrl={state.transcript_url}
              uploadedItemName="Transcript"
              onEdit={handleEdit}
              onDelete={handleDelete}
            /> :
            isEditing.transcript_url ?
              <FileUploadBox
                label="Edit Transcript File"
                accepts=".pdf"
                uploadInstructions="Upload PDF files of up to 50 MB and click save documents"
                isEditView={isEditing.transcript_url}
                onExitEditView={() => setIsEditing({ ...isEditing, transcript_url: false })}
                onFileSelect={handleFileSelect}
              /> :
              <FileUploadBox
                label="Upload Transcript File"
                accepts=".pdf"
                uploadInstructions="Upload PDF files of up to 50 MB and click save documents"
                onFileSelect={(file) => console.log("Selected file:", file)}
              />
        }
      </div>

    </PageContentWrapper>
  );
}
