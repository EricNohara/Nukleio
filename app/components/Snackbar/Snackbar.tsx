"use client";

import { X, TriangleAlert, CircleAlert, CircleCheck, Info, LucideIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import styles from "./Snackbar.module.css";

export type SnackbarVariant = "success" | "error" | "warning" | "info";

type SnackbarProps = {
    message: string;
    messageDescription?: string;
    variant?: SnackbarVariant;
    onClose?: () => void;
    duration?: number;
};

const EXIT_MS = 200;

export default function Snackbar({
    message,
    messageDescription = "",
    variant = "info",
    onClose,
    duration = 4000,
}: SnackbarProps) {
    const [isExiting, setIsExiting] = useState(false);

    const startClose = useCallback(() => {
        if (isExiting) return;
        setIsExiting(true);

        window.setTimeout(() => {
            onClose?.();
        }, EXIT_MS);
    }, [isExiting, onClose]);

    useEffect(() => {
        if (!duration) return;

        const timer = window.setTimeout(() => {
            startClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, startClose]);

    const Icon: LucideIcon =
        variant === "error" ? TriangleAlert :
            variant === "warning" ? CircleAlert :
                variant === "success" ? CircleCheck :
                    Info;

    return (
        <div className={`${styles.snackbar} ${styles[variant]} ${styles.enter} ${isExiting ? styles.exit : ""}`}>
            <Icon size={35} color="white" />

            <div className={styles.messageContainer}>
                <h3>{message}</h3>
                {messageDescription && <span>{messageDescription}</span>}
            </div>

            {onClose && (
                <button
                    className={styles.close}
                    onClick={startClose}
                    aria-label="Close notification"
                >
                    <X size={25} />
                </button>
            )}
        </div>
    );
}
