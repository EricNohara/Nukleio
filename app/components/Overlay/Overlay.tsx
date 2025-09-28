"use client";

import { ReactNode, useEffect } from "react";

import styles from "./Overlay.module.css";

interface IOverlayProps {
    onClose: () => void;
    children: ReactNode;
}

export default function Overlay({ onClose, children }: IOverlayProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            {children}
        </div>
    );
}