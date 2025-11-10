"use client";

import React, { ChangeEvent } from "react";

import { headerFont } from "@/app/localFonts";

import styles from "./TextInput.module.css";

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
}

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
    className = ""
}: TextInputProps) {
    const inputClass = `${isInInputForm ? styles.inputFormInput : styles.textInput} ${className}`;

    return (
        <div className={styles.inputDiv}>
            <label className={`${styles.inputLabel} ${isInInputForm && styles.inputFormInputLabel} ${headerFont.className}`} htmlFor={name}>
                {required ? `${label} *` : label}
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
                <input
                    className={inputClass}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    type={type}
                    required={required}
                    disabled={disabled}
                />}

        </div>
    );
}
