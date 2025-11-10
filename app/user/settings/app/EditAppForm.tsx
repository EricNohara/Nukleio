"use client";

import React, { useState } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne, ButtonFour } from "@/app/components/Buttons/Buttons";
import Switch from "@/app/components/Switch/Switch";
import { headerFont } from "@/app/localFonts";

import styles from "./EditAppForm.module.css";

interface IAppSettings {
    isDarkMode: boolean;
    isHighContrastMode: boolean;
    language: string;
}

interface ILanguage {
    value: string,
    label: string
}

const DEFAULT_APP_SETTINGS: IAppSettings = {
    isDarkMode: false,
    isHighContrastMode: false,
    language: "English"
}

const LANGUAGES: ILanguage[] = [
    { value: "English", label: "English" },
    { value: "Spanish", label: "Español" },
    { value: "French", label: "Français" },
    { value: "German", label: "Deutsch" },
    { value: "Japanese", label: "日本語" },
];

export default function EditAppForm() {
    const [formData, setFormData] = useState<IAppSettings>(DEFAULT_APP_SETTINGS);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleToggle = (key: keyof IAppSettings) => {
        setFormData((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // await updateAppSettings(formData)
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert("Error updating app settings!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className={styles.inputForm} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
                <div className={styles.headerText}>
                    <h1 className={`${headerFont.className} ${styles.formTitle}`}>App Settings</h1>
                    <h3 className={`${styles.formSubtitle} ${headerFont.className}`}>Personalize your app appearance</h3>
                </div>
                <div className={styles.buttons}>
                    {isEditing ?
                        <>
                            <ButtonFour
                                onClick={() => {
                                    setFormData(DEFAULT_APP_SETTINGS);
                                    setIsEditing(false);
                                }}>
                                Cancel
                            </ButtonFour>
                            <ButtonOne type="submit" disabled={isLoading}>
                                <LoadableButtonContent isLoading={isLoading} buttonLabel="Save" />
                            </ButtonOne>
                        </>
                        : <ButtonOne onClick={() => { setIsEditing(true); setIsLoading(false) }}>Edit</ButtonOne>
                    }

                </div>
            </div>
            <div className={styles.inputList}>
                <Switch
                    label="Dark Mode"
                    checked={formData.isDarkMode}
                    onChange={() => handleToggle("isDarkMode")}
                    disabled={!isEditing}
                />

                <Switch
                    label="High Contrast Mode"
                    checked={formData.isHighContrastMode}
                    onChange={() => handleToggle("isHighContrastMode")}
                    disabled={!isEditing}
                />

                <div className={styles.settingItem}>
                    <label className={`${styles.label} ${headerFont.className}`}>
                        Language
                    </label>
                    <select
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={headerFont.className}
                    >
                        {
                            LANGUAGES.map((lang, idx) => <option value={lang.value} key={idx}>{lang.label}</option>)
                        }
                    </select>
                </div>
            </div>
        </form >
    );
}