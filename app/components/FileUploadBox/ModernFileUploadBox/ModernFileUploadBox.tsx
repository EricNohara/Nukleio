"use client";

import { FileText, ImagePlus, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { headerFont } from "@/app/localFonts";

import styles from "./ModernFileUploadBox.module.css";
import { ExitButton } from "../../Buttons/Buttons";

interface IFileUploadBoxProps {
    label?: string;
    accepts?: string;
    uploadInstructions?: string;
    onFileSelect: (file: File, docType: string) => void;
    docType: string;
    className?: string;
    isMini?: boolean;
    required?: boolean;
    previewUrl?: string | null;
    previewName?: string;
    onClearPreview?: () => void;
    disabled?: boolean;
}

export default function ModernFileUploadBox({
    label,
    accepts,
    uploadInstructions,
    onFileSelect,
    docType,
    className,
    isMini = false,
    required = false,
    previewUrl: externalPreviewUrl,
    previewName,
    onClearPreview,
    disabled = false,
}: IFileUploadBoxProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [dragging, setDragging] = useState(false);

    // keep the actual file so we can preview it
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // make a temporary preview URL for the selected file
    const localPreviewUrl = useMemo(() => {
        if (!selectedFile) return null;
        return URL.createObjectURL(selectedFile);
    }, [selectedFile]);

    const activePreviewUrl = localPreviewUrl ?? externalPreviewUrl ?? null;
    const hasPreview = !!selectedFile || !!externalPreviewUrl;
    const displayName = selectedFile?.name ?? previewName ?? "Cached image";

    // cleanup object URL
    useEffect(() => {
        return () => {
            if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        };
    }, [localPreviewUrl]);

    const isImage =
        !!selectedFile?.type.startsWith("image/") ||
        !!externalPreviewUrl;
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
        onClearPreview?.();

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
        <div className={styles.uploadLabelContainer}>
            <p className={headerFont.className}>{label}{required && <span className={styles.asterisk}>*</span>}</p>

            <div
                role="button"
                tabIndex={0}
                className={`
                    ${styles.uploadBox}
                    ${dragging ? styles.dragging : ""}
                    ${disabled ? styles.disabled : ""}
                    ${className ?? ""}
                    ${isMini ? styles.miniUploadBox : ""}
                `}
                onClick={() => {
                    if (!disabled) {
                        inputRef.current?.click();
                    }
                }}
                onKeyDown={(e) => {
                    if (!disabled && (e.key === "Enter" || e.key === " ")) {
                        inputRef.current?.click();
                    }
                }}
                onDragOver={(e) => {
                    if (disabled) return;
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    if (disabled) return;
                    handleDrop(e);
                }}
            >
                <input
                    type="file"
                    accept={accepts}
                    ref={inputRef}
                    className={styles.fileInput}
                    onChange={handleFileChange}
                    disabled={disabled}
                />

                {!hasPreview && (
                    <div className={styles.labelContainer}>
                        <div className={styles.iconCircle}>
                            <ImagePlus className={styles.icon} size={20} />
                        </div>

                        <h1 className={`${styles.label} ${isMini ? styles.miniLabel : ""} ${headerFont.className}`}>
                            Drop images here or click
                        </h1>

                        {uploadInstructions && (
                            <h2 className={`${styles.subLabel} ${isMini ? styles.miniSubLabel : ""}`}>
                                {uploadInstructions}
                            </h2>
                        )}
                    </div>
                )}

                {/* PREVIEW */}
                {hasPreview && activePreviewUrl && (
                    <div className={`${styles.previewContainer} ${!isMini ? styles.previewLarge : styles.previewMini}`}>
                        <ExitButton
                            onClick={(e) => {
                                e.stopPropagation();
                                clearFile();
                            }}
                            aria-label="Remove file"
                            className={styles.clearPreviewBtn}
                        >
                            <X size={16} strokeWidth={3} />
                        </ExitButton>

                        <div className={styles.previewInner}>
                            {isImage ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        className={styles.imagePreview}
                                        src={activePreviewUrl}
                                        alt="Selected file preview"
                                    />
                                </>
                            ) : isPdf ? (
                                <iframe className={styles.pdfPreview} src={activePreviewUrl} title="PDF preview" />
                            ) : (
                                <div className={styles.genericPreview}>
                                    <FileText size={20} />
                                </div>
                            )}

                            <div className={styles.previewFooter}>
                                <div className={styles.previewName} title={displayName}>
                                    {displayName}
                                </div>
                                {selectedFile && (
                                    <div className={styles.previewSize}>
                                        {formatBytes(selectedFile.size)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}