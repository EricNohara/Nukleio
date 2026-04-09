"use client";

import { Check } from "lucide-react";

import styles from "./CheckboxIndicator.module.css";

type CheckboxIndicatorProps = {
    checked: boolean;
};

export default function CheckboxIndicator({ checked }: CheckboxIndicatorProps) {
    return (
        <div
            className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ""}`}
        >
            {checked && <Check size={20} strokeWidth={3} />}
        </div>
    );
}