"use client";

import { FileText, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import styles from "./FileUploadBox.module.css";
import { ButtonOne, ButtonTwo, ExitButton } from "../Buttons/Buttons";

interface IFileUploadBoxProps {
    label?: string;
    accepts?: string;
    uploadInstructions?: string;
    isEditView?: boolean;
    onExitEditView?: () => void;
    onFileSelect: (file: File, docType: string) => void;
    docType: string;
    className?: string;
    isMini?: boolean;
}

export default function FileUploadBox({
    label,
    accepts,
    uploadInstructions,
    isEditView,
    onExitEditView,
    onFileSelect,
    docType,
    className,
    isMini = false,
}: IFileUploadBoxProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [dragging, setDragging] = useState(false);

    // keep the actual file so we can preview it
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // make a temporary preview URL for the selected file
    const previewUrl = useMemo(() => {
        if (!selectedFile) return null;
        return URL.createObjectURL(selectedFile);
    }, [selectedFile]);

    // cleanup object URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const isImage = !!selectedFile?.type.startsWith("image/");
    const isPdf = selectedFile?.type === "application/pdf";

    const acceptOk = (file: File) => {
        if (!accepts) return true;
        // accept can be ".pdf,.png" OR "image/*"
        if (file.type && file.type.match(accepts)) return true;
        return accepts.split(",").some((a) => file.name.toLowerCase().endsWith(a.trim().toLowerCase()));
    };

    const setFile = (file: File) => {
        setSelectedFile(file);
        onFileSelect(file, docType);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && acceptOk(file)) setFile(file);

        // allow re-selecting the same file later
        e.target.value = "";
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && acceptOk(file)) setFile(file);
    };

    const clearFile = () => {
        setSelectedFile(null);
        setDragging(false);

        // clear native input so same file can be reselected
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const val = bytes / Math.pow(k, i);
        return `${val.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
    };

    return (
        <div
            className={`${styles.uploadBox} ${dragging ? styles.dragging : ""} ${className ?? ""} ${isMini ? styles.miniUploadBox : ""
                }`}
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
                {label && <h1 className={`${styles.label} ${isMini ? styles.miniLabel : ""}`}>{label}</h1>}
                {!selectedFile &&
                    <h2 className={`${styles.subLabel} ${isMini ? styles.miniSubLabel : ""}`}>
                        {"Drag and drop or select a file"}
                    </h2>
                }
            </div>

            {/* PREVIEW */}
            {selectedFile && previewUrl && (
                <div className={`${styles.previewContainer} ${!isMini ? styles.previewLarge : styles.previewMini}`}>
                    <ExitButton
                        onClick={(e) => {
                            e.stopPropagation();
                            clearFile();
                        }}
                        aria-label="Remove file"
                        className={styles.clearPreviewBtn}
                    >
                        <X size={16} />
                    </ExitButton>

                    <div className={styles.previewInner}>
                        {isImage ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    className={styles.imagePreview}
                                    src={previewUrl}
                                    alt="Selected file preview"
                                />
                            </>
                        ) : isPdf ? (
                            <iframe className={styles.pdfPreview} src={previewUrl} title="PDF preview" />
                        ) : (
                            <div className={styles.genericPreview}>
                                <FileText size={20} />
                            </div>
                        )}

                        <div className={styles.previewFooter}>
                            <div className={styles.previewName} title={selectedFile.name}>
                                {selectedFile.name}
                            </div>
                            <div className={styles.previewSize}>{formatBytes(selectedFile.size)}</div>
                        </div>
                    </div>
                </div>
            )}

            {!selectedFile &&
                <ButtonOne type="button" onClick={() => inputRef.current?.click()}>
                    Browse Files
                </ButtonOne>
            }

            {uploadInstructions && !selectedFile && (
                <div className={styles.uploadInstructionsContainer}>
                    <p className={styles.uploadInstructions}>{uploadInstructions}</p>
                </div>
            )}

            {isEditView && (
                <ButtonTwo className={styles.exitEditBtn} onClick={onExitEditView}>
                    Cancel
                </ButtonTwo>
            )}
        </div>
    );
}