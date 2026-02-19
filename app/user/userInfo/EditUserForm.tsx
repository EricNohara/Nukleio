"use client";

import { Phone, Link2, SquareUserRound, BriefcaseBusiness } from "lucide-react";
import React, { useState, useEffect } from "react";

import TextInput from "@/app/components/TextInput/TextInput";
import { useToast } from "@/app/context/ToastProvider";
import { useUser } from "@/app/context/UserProvider";
import IUser from "@/app/interfaces/IUser";

import styles from "./EditUserForm.module.css";

interface IBasicUserInfo {
    email: string;
    name: string | null;
    bio: string | null;
    current_position: string | null;
    current_company: string | null;
    phone_number: string | null;
    current_address: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    facebook_url: string | null;
    instagram_url: string | null;
    x_url: string | null;
}

interface EditUserFormProps {
    formId: string;
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    setIsSaving: (v: boolean) => void;
}

const EMPTY_USER: IBasicUserInfo = {
    email: "",
    name: null,
    bio: null,
    current_position: null,
    current_company: null,
    phone_number: null,
    current_address: null,
    github_url: null,
    linkedin_url: null,
    facebook_url: null,
    instagram_url: null,
    x_url: null,
}

export default function EditUserForm({
    formId,
    isEditing,
    setIsEditing,
    setIsSaving,
}: EditUserFormProps) {
    const [formData, setFormData] = useState<IBasicUserInfo>(EMPTY_USER);
    const { state, dispatch } = useUser();
    const toast = useToast();

    useEffect(() => {
        if (isEditing) return;

        setFormData({
            email: state.email,
            name: state.name,
            bio: state.bio,
            current_position: state.current_position,
            current_company: state.current_company,
            phone_number: state.phone_number,
            current_address: state.current_address,
            github_url: state.github_url,
            linkedin_url: state.linkedin_url,
            facebook_url: state.facebook_url,
            instagram_url: state.instagram_url,
            x_url: state.x_url,
        });
    }, [state, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const userData: IUser = {
            ...formData,
            portrait_url: state.portrait_url,
            resume_url: state.resume_url,
            transcript_url: state.transcript_url
        }

        if (!userData.email.trim()) {
            setIsSaving(false);
            toast.warning("Warning", "Email is required. Please enter an email address before saving.");
            return;
        }

        try {
            const res = await fetch("/api/internal/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // update cached user
            dispatch({ type: "SET_USER", payload: userData })
            setIsEditing(false);

            toast.success("Success", "Successfully udpated user data.");
        } catch {
            toast.error("Error", "Failed to udpate user data.");
        } finally {
            setIsSaving(false);
        }
    }


    return (
        <form className={styles.inputForm} onSubmit={handleSubmit} id={formId}>
            <div className={styles.inputCardGrid}>
                <div className={styles.inputCard}>
                    <div className={styles.cardHeader}>
                        <SquareUserRound />
                        <h3 className={styles.cardTitle}>Basic Information</h3>
                    </div>
                    <div className={styles.inputRow}>
                        <TextInput
                            name="name"
                            label="Full Name"
                            value={isEditing ? (formData.name ?? "") : (state.name ?? "")}
                            required={false}
                            placeholder={isEditing ? "Enter name" : "No name"}
                            disabled={!isEditing}
                            onChange={handleChange}
                            isInInputForm={true}
                            focusLabelColor="var(--btn-1)"
                        />
                        <TextInput
                            name="current_address"
                            label="Address"
                            value={
                                isEditing
                                    ? (formData.current_address ?? "")
                                    : (state.current_address ?? "")
                            }
                            required={false}
                            placeholder={isEditing ? "Enter address" : "No address"}
                            disabled={!isEditing}
                            onChange={handleChange}
                            isInInputForm={true}
                            focusLabelColor="var(--btn-1)"
                        />
                    </div>

                    <TextInput
                        name="bio"
                        label="Bio"
                        value={isEditing ? (formData.bio ?? "") : (state.bio ?? "")}
                        required={false}
                        placeholder={isEditing ? "Enter bio" : "No bio"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        isInInputForm={true}
                        type="textarea"
                        textAreaRows={10}
                        focusLabelColor="var(--btn-1)"
                    />
                </div>
                <div className={styles.inputCard}>
                    <div className={styles.cardHeader}>
                        <Phone />
                        <h3 className={styles.cardTitle}>Contact Information</h3>
                    </div>
                    <TextInput
                        name="email"
                        label="Email"
                        value={isEditing ? formData.email : state.email}
                        required={true}
                        placeholder={isEditing ? "Enter email" : "No email"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                    />
                    <TextInput
                        name="phone_number"
                        label="Phone Number"
                        value={
                            isEditing
                                ? (formData.phone_number ?? "")
                                : (state.phone_number ?? "")
                        }
                        required={false}
                        placeholder={isEditing ? "Enter phone number" : "No phone number"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                    />
                </div>
                <div className={styles.inputCard}>
                    <div className={styles.cardHeader}>
                        <BriefcaseBusiness />
                        <h3 className={styles.cardTitle}>Employment Information</h3>
                    </div>
                    <TextInput
                        name="current_company"
                        label="Current Company"
                        value={
                            isEditing
                                ? (formData.current_company ?? "")
                                : (state.current_company ?? "")
                        }
                        required={false}
                        placeholder={isEditing ? "Enter current company" : "No company"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                    />

                    <TextInput
                        name="current_position"
                        label="Current Position"
                        value={
                            isEditing
                                ? (formData.current_position ?? "")
                                : (state.current_position ?? "")
                        }
                        required={false}
                        placeholder={isEditing ? "Enter current position" : "No position"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                    />
                </div>
                <div className={styles.inputCard}>
                    <div className={styles.cardHeader}>
                        <Link2 />
                        <h3 className={styles.cardTitle}>Social Media Links</h3>
                    </div>
                    <TextInput
                        name="github_url"
                        label="GitHub"
                        value={isEditing ? (formData.github_url ?? "") : (state.github_url ?? "")}
                        required={false}
                        placeholder={isEditing ? "https://github.com/..." : "No GitHub url"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                    />

                    <TextInput
                        name="linkedin_url"
                        label="LinkedIn"
                        value={isEditing ? (formData.linkedin_url ?? "") : (state.linkedin_url ?? "")}
                        required={false}
                        placeholder={isEditing ? "https://linkedin.com/in/..." : "No LinkedIn url"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                    />

                    <TextInput
                        name="x_url"
                        label="X"
                        value={isEditing ? (formData.x_url ?? "") : (state.x_url ?? "")}
                        required={false}
                        placeholder={isEditing ? "https://x.com/..." : "No X url"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                    />

                    <TextInput
                        name="instagram_url"
                        label="Instagram"
                        value={isEditing ? (formData.instagram_url ?? "") : (state.instagram_url ?? "")}
                        required={false}
                        placeholder={isEditing ? "https://instagram.com/..." : "No Instagram url"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                    />

                    <TextInput
                        name="facebook_url"
                        label="Facebook"
                        value={isEditing ? (formData.facebook_url ?? "") : (state.facebook_url ?? "")}
                        required={false}
                        placeholder={isEditing ? "https://facebook.com/..." : "No Facebook url"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                    />
                </div>
            </div>
        </form >
    );
}