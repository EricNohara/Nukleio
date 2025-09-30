"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import FileUploadBox from "@/app/components/FileUploadBox/FileUploadBox";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import styles from "./DocumentsPage.module.css";
import { IButton } from "@/app/components/PageContentHeader/PageContentHeader";

import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";

import DocumentsList from "./documents-list";

export default function DocumentsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const authenticator = async () => {
      try {
        const res = await fetch("/api/internal/auth/authenticated", { method: "GET" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message);
        }

        setUser(data.user);
      } catch (err) {
        console.error(err);
        router.push("/");
      }
    };

    authenticator();
  }, [router]);

  const buttonOne: IButton = {
    name: "Save Documents",
    onClick: () => { },
  }

  return (
    <PageContentWrapper>
      <PageContentHeader title="Documents" buttonOne={buttonOne} />
      {/* <DocumentsList user={user} /> */}
      <div className={styles.fileUploadBoxContainer}>
        <FileUploadBox
          label="Upload Profile Picture"
          accepts="image/*"
          uploadInstructions="Upload image files of up to 50 MB and click save documents"
          onFileSelect={(file) => console.log("Selected file:", file)}
        />
        <FileUploadBox
          label="Upload Resume File"
          accepts=".pdf"
          uploadInstructions="Upload PDF files of up to 50 MB and click save documents"
          onFileSelect={(file) => console.log("Selected file:", file)}
        />
        <FileUploadBox
          label="Upload Transcript File"
          accepts=".pdf"
          uploadInstructions="Upload PDF files of up to 50 MB and click save documents"
          onFileSelect={(file) => console.log("Selected file:", file)}
        />
      </div>

    </PageContentWrapper>
  );
}
