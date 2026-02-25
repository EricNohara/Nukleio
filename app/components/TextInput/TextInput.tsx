"use client";

import { Eye, EyeOff, Calendar } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";

import { headerFont } from "@/app/localFonts";

import styles from "./TextInput.module.css";

import type { CSSProperties } from "react";

interface TextInputProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    isInInputForm?: boolean;
    textAreaRows?: number;
    disabled?: boolean;
    className?: string;
    outerClassname?: string;
    focusLabelColor?: string;
}

type StyleWithFocusLabelVar = CSSProperties & {
    "--focus-label-color"?: string;
};

export default function TextInput({
    label,
    name,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
    isInInputForm = false,
    textAreaRows = 4,
    disabled = false,
    className = "",
    outerClassname = "",
    focusLabelColor,
}: TextInputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const isPassword = type === "password";
    const isDate = type === "date";

    const actualType = isPassword && showPassword ? "text" : type;

    const inputClass = `${isInInputForm ? styles.inputFormInput : styles.textInput} ${isPassword || isDate ? styles.hasToggle : ""
        } ${className}`;

    const focusStyle: StyleWithFocusLabelVar | undefined = focusLabelColor
        ? { "--focus-label-color": focusLabelColor }
        : undefined;

    const openDatePicker = () => {
        if (!inputRef.current) return;

        // always focus
        inputRef.current.focus();

        // Chromium supports showPicker()
        // eslint-disable-next-line
        const anyInput = inputRef.current as any;
        if (typeof anyInput.showPicker === "function") {
            anyInput.showPicker();
            return;
        }

        // fallback: click the input (works in many browsers)
        inputRef.current.click();
    };

    return (
        <div className={`${styles.inputDiv} ${outerClassname ? outerClassname : ""}`} style={focusStyle}>
            <label
                className={`${styles.inputLabel} ${isInInputForm && styles.inputFormInputLabel} ${headerFont.className}`}
                htmlFor={name}
            >
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>

            {type === "textarea" ? (
                <textarea
                    className={inputClass}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    rows={textAreaRows}
                    disabled={disabled}
                />
            ) : (
                <div className={styles.inputWrapper}>
                    <input
                        ref={type === "date" ? inputRef : undefined}
                        className={inputClass}
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        type={actualType}
                        required={required}
                        disabled={disabled}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    )}

                    {isDate && (
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={openDatePicker}
                            tabIndex={-1}
                            aria-label="Open date picker"
                            disabled={disabled}
                        >
                            <Calendar className={styles.calendarIcon} size={20} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}