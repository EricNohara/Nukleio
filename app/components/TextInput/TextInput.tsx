"use client";

import { Eye, EyeOff } from "lucide-react";
import React, { ChangeEvent } from "react";
import { useState } from "react";


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
    focusLabelColor
}: TextInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const actualType = isPassword && showPassword ? "text" : type;
    const inputClass =
        `${isInInputForm ? styles.inputFormInput : styles.textInput} ${isPassword ? styles.hasToggle : ""} ${className}`;

    const focusStyle: StyleWithFocusLabelVar | undefined = focusLabelColor
        ? { "--focus-label-color": focusLabelColor }
        : undefined;

    return (
        <div className={`${styles.inputDiv} ${outerClassname ? outerClassname : ""}`} style={focusStyle}>
            <label className={`${styles.inputLabel} ${isInInputForm && styles.inputFormInputLabel} ${headerFont.className}`} htmlFor={name}>
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>
            {type === "textarea" ?
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
                :
                <div className={styles.inputWrapper}>
                    <input
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
                </div>
            }
        </div>
    );
}
