"use client";

import React, { useState, useEffect } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne, ButtonFour } from "@/app/components/Buttons/Buttons";
import TextInput from "@/app/components/TextInput/TextInput";
import { useUser } from "@/app/context/UserProvider";
import IUser from "@/app/interfaces/IUser";
import { headerFont } from "@/app/localFonts";

import styles from "./EditUserForm.module.css";


interface IInput {
    name: string;
    label: string;
    value: string;
    required: boolean;
    placeholder: string;
    placeholderViewOnly: string;
}

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

export default function EditUserForm() {
    const [formData, setFormData] = useState<IBasicUserInfo>(EMPTY_USER);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { state, dispatch } = useUser();

    useEffect(() => {
        const userData: IBasicUserInfo = {
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
        };

        setFormData(userData);
    }, [state]);

    const inputs: IInput[][] = [
        [
            {
                name: "email",
                label: "Email",
                value: formData.email,
                required: true,
                placeholder: "Enter email",
                placeholderViewOnly: "No email"
            },
            {
                name: "phone_number",
                label: "Phone Number",
                value: formData.phone_number ? formData.phone_number : "",
                required: false,
                placeholder: "Enter phone number",
                placeholderViewOnly: "No phone number"
            },
        ],
        [{
            name: "name",
            label: "Full Name",
            value: formData.name ? formData.name : "",
            required: false,
            placeholder: "Enter name",
            placeholderViewOnly: "No name"
        },
        {
            name: "current_address",
            label: "Address",
            value: formData.current_address ? formData.current_address : "",
            required: false,
            placeholder: "Enter current address",
            placeholderViewOnly: "No current address"
        }],
        [{
            name: "current_company",
            label: "Current Company",
            value: formData.current_company ? formData.current_company : "",
            required: false,
            placeholder: "Enter current company",
            placeholderViewOnly: "No current company"
        },
        {
            name: "current_position",
            label: "Current Position",
            value: formData.current_position ? formData.current_position : "",
            required: false,
            placeholder: "Enter current position",
            placeholderViewOnly: "No current position"
        }],
        [{
            name: "github_url",
            label: "GitHub",
            value: formData.github_url ? formData.github_url : "",
            required: false,
            placeholder: "Enter GitHub url",
            placeholderViewOnly: "No GitHub url"
        },
        {
            name: "linkedin_url",
            label: "LinkedIn",
            value: formData.linkedin_url ? formData.linkedin_url : "",
            required: false,
            placeholder: "Enter LinkedIn url",
            placeholderViewOnly: "No LinkedIn url"
        }],
        [{
            name: "bio",
            label: "Bio",
            value: formData.bio ? formData.bio : "",
            required: false,
            placeholder: "Enter bio",
            placeholderViewOnly: "No bio"
        },
        {
            name: "x_url",
            label: "X",
            value: formData.x_url ? formData.x_url : "",
            required: false,
            placeholder: "Enter X url",
            placeholderViewOnly: "No X url"
        }],
        [{
            name: "facebook_url",
            label: "Facebook",
            value: formData.facebook_url ? formData.facebook_url : "",
            required: false,
            placeholder: "Enter Facebook url",
            placeholderViewOnly: "No Facebook url"
        },
        {
            name: "instagram_url",
            label: "Instagram",
            value: formData.instagram_url ? formData.instagram_url : "",
            required: false,
            placeholder: "Enter Instagram url",
            placeholderViewOnly: "No Instagram url"
        }
        ],
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const userData: IUser = {
            ...formData,
            portrait_url: state.portrait_url,
            resume_url: state.resume_url,
            transcript_url: state.transcript_url
        }

        if (!userData.email) return;

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
        } catch (error) {
            console.error(error);
            alert("Error updating user data!");
        }
    }


    return (
        <form className={styles.inputForm} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
                <div className={styles.headerText}>
                    <h1 className={`${headerFont.className} ${styles.formTitle}`}>User Info</h1>
                    <h3 className={`${styles.formSubtitle} ${headerFont.className}`}>Update your personal details</h3>
                </div>
                <div className={styles.buttons}>
                    {isEditing ?
                        <>
                            <ButtonFour
                                onClick={() => {
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
                {inputs.map((inputRow, rowIndex) => (
                    inputRow.length > 1 ? (
                        <div key={rowIndex} className={styles.inputRow}>
                            {inputRow.map((input, colIndex) => (
                                <TextInput
                                    key={colIndex}
                                    name={input.name}
                                    label={input.label}
                                    value={input.value}
                                    required={input.required}
                                    disabled={isEditing ? false : true}
                                    onChange={handleChange}
                                    isInInputForm={true}
                                    className={styles.textInput}
                                    placeholder={isEditing ? input.placeholder : input.placeholderViewOnly}
                                />
                            ))}
                        </div>
                    ) : (
                        <TextInput
                            key={rowIndex}
                            name={inputRow[0].name}
                            label={inputRow[0].label}
                            value={inputRow[0].value}
                            required={inputRow[0].required}
                            disabled={isEditing ? false : true}
                            onChange={handleChange}
                            isInInputForm={true}
                            className={styles.textInput}
                            placeholder={isEditing ? inputRow[0].placeholder : inputRow[0].placeholderViewOnly}
                        />
                    )
                ))}
            </div>
        </form >
    );
}