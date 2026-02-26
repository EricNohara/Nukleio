"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import Snackbar, { SnackbarState, SnackbarVariant } from "@/app/components/Snackbar/Snackbar";

type ToastInput = {
    message: string;
    messageDescription?: string;
    variant?: SnackbarVariant;
    duration?: number;
};

type ToastContextValue = {
    show: (t: ToastInput) => void;
    success: (message: string, messageDescription?: string, duration?: number) => void;
    error: (message: string, messageDescription?: string, duration?: number) => void;
    warning: (message: string, messageDescription?: string, duration?: number) => void;
    info: (message: string, messageDescription?: string, duration?: number) => void;
    clear: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [snackbar, setSnackbar] = useState<SnackbarState>(null);
    const [duration, setDuration] = useState<number>(4000);

    // Optional: force re-mount to restart enter animation when showing back-to-back toasts
    const [snackbarKey, setSnackbarKey] = useState(0);

    const show = useCallback((t: ToastInput) => {
        const next: SnackbarState = {
            message: t.message,
            messageDescription: t.messageDescription ?? "",
            variant: t.variant ?? "info",
        };
        setDuration(t.duration ?? 4000);
        setSnackbarKey((k) => k + 1);
        setSnackbar(next);
    }, []);

    const clear = useCallback(() => setSnackbar(null), []);

    const api = useMemo<ToastContextValue>(() => {
        const wrap =
            (variant: SnackbarVariant) =>
                (message: string, messageDescription = "", d?: number) =>
                    show({ message, messageDescription, variant, duration: d });

        return {
            show,
            success: wrap("success"),
            error: wrap("error"),
            warning: wrap("warning"),
            info: wrap("info"),
            clear,
        };
    }, [show, clear]);

    return (
        <ToastContext.Provider value={api}>
            {children}

            {snackbar && (
                <Snackbar
                    key={snackbarKey}
                    message={snackbar.message}
                    messageDescription={snackbar.messageDescription}
                    variant={snackbar.variant}
                    duration={duration}
                    onClose={clear}
                />
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within a ToastProvider");
    return ctx;
}
