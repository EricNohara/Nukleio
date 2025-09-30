"use client";

import React, { useRef, useState } from "react";
import styles from "./FileUploadBox.module.css";
import { ButtonOne } from "../Buttons/Buttons";

interface IFileUploadBoxProps {
    label?: string;
    accepts?: string;
    uploadInstructions?: string;
    onFileSelect: (file: File) => void
}

export default function FileUploadBox({ label, accepts, uploadInstructions, onFileSelect }: IFileUploadBoxProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [fileName, setFileName] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            onFileSelect(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);

        const file = e.dataTransfer.files?.[0];
        // check file extension
        if (file && (!accepts || file.type.match(accepts) || accepts.split(",").some(a => file.name.endsWith(a.trim())))) {
            setFileName(file.name);
            onFileSelect(file);
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
        </div>
    );
}