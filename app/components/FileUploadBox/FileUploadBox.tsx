"use client";

import { Check } from "lucide-react";
import React, { useRef, useState } from "react";

import styles from "./FileUploadBox.module.css";
import { ButtonOne, ButtonTwo } from "../Buttons/Buttons";

interface IFileUploadBoxProps {
    label?: string;
    accepts?: string;
    uploadInstructions?: string;
    isEditView?: boolean;
    onExitEditView?: () => void;
    onFileSelect: (file: File, docType: string) => void;
    docType: string;
}

export default function FileUploadBox({ label, accepts, uploadInstructions, isEditView, onExitEditView, onFileSelect, docType }: IFileUploadBoxProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [fileName, setFileName] = useState("");
    const [isChecked, setIsChecked] = useState<boolean>(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            onFileSelect(file, docType);
            setIsChecked(true);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);

        const file = e.dataTransfer.files?.[0];
        // check file extension
        if (file && (!accepts || file.type.match(accepts) || accepts.split(",").some(a => file.name.endsWith(a.trim())))) {
            setFileName(file.name);
            onFileSelect(file, docType);
            setIsChecked(true);
        }
    };

    return (
        <div
            className={`${styles.uploadBox} ${dragging ? styles.dragging : ""}`}
            onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept={accepts}
                ref={inputRef}
                className={styles.fileInput}
                onChange={handleFileChange}
            />

            {/* checkmark when a file is uploaded */}
            {isChecked &&
                <div className={styles.saveMsg}>
                    <div className={styles.checkmark}><Check /></div>
                    Click save documents to upload
                </div>
            }

            <div className={styles.labelContainer}>
                {label && <h1 className={styles.label}>{label}</h1>}
                <h2 className={styles.subLabel}>{fileName || "Drag and drop or select a file"}</h2>
            </div>
            <ButtonOne onClick={() => inputRef.current?.click()}>
                Browse Files
            </ButtonOne>
            {uploadInstructions &&
                <div className={styles.uploadInstructionsContainer}>
                    <p className={styles.uploadInstructions}>{uploadInstructions}</p>
                </div>
            }

            {/* cancel button only for edit view */}
            {isEditView && <ButtonTwo className={styles.exitEditBtn} onClick={onExitEditView}>Cancel</ButtonTwo>}

        </div>
    );
}