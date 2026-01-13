"use client";

import { X } from "lucide-react";
import React, { useEffect } from "react";

import styles from "./Snackbar.module.css";

export type SnackbarVariant = "success" | "error" | "info";

type SnackbarProps = {
    message: string;
    variant?: SnackbarVariant;
    onClose?: () => void;
    duration?: number; // ms (auto-dismiss)
};

export default function Snackbar({
    message,
    variant = "info",
    onClose,
    duration = 4000,
}: SnackbarProps) {
    useEffect(() => {
        if (!duration) return;

        const timer = setTimeout(() => {
            onClose?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`${styles.snackbar} ${styles[variant]}`}>
            <span>{message}</span>
            {onClose && (
                <button
                    className={styles.close}
                    onClick={onClose}
                    aria-label="Close notification"
                >
                    <X />
                </button>
            )}
        </div>
    );
}
