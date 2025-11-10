"use client";

import React from "react";

import { headerFont } from "@/app/localFonts";

import styles from "./Switch.module.css";

interface SwitchProps {
    label: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

export default function Switch({ label, checked, onChange, disabled = false }: SwitchProps) {
    return (
        <label className={styles.switchContainer}>
            <span className={`${styles.labelText} ${headerFont.className}`}>{label}</span>
            <div className={styles.switchWrapper}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className={styles.switchInput}
                />
                <span className={`${styles.slider} ${checked ? styles.checked : ""}`} />
            </div>
        </label>
    );
}
