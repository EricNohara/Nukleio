"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserProvider";
import styles from "./EditUserForm.module.css";
import { ButtonOne, ButtonFour } from "@/app/components/Buttons/Buttons";
import { headerFont } from "@/app/localFonts";
import TextInput from "@/app/components/TextInput/TextInput";

interface IInput {
    name: string;
    label: string;
    value: string;
    required: boolean;
    disabled: boolean;
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
        [{
            name: "name",
            label: "Full Name",
            value: formData.name ? formData.name : "",
            required: false,
            disabled: false
        },
        {
            name: "current_address",
            label: "Address",
            value: formData.current_address ? formData.current_address : "",
            required: false,
            disabled: false
        }],
        [
            {
                name: "email",
                label: "Email",
                value: formData.email,
                required: true,
                disabled: false
            },
            {
                name: "phone_number",
                label: "Phone Number",
                value: formData.phone_number ? formData.phone_number : "",
                required: false,
                disabled: false
            },
        ],
        [{
            name: "current_company",
            label: "Current Company",
            value: formData.current_company ? formData.current_company : "",
            required: false,
            disabled: false
        },
        {
            name: "current_position",
            label: "Current Position",
            value: formData.current_position ? formData.current_position : "",
            required: false,
            disabled: false
        }],
        [{
            name: "bio",
            label: "Bio",
            value: formData.bio ? formData.bio : "",
            required: false,
            disabled: false
        }],
        [{
            name: "github_url",
            label: "GitHub",
            value: formData.github_url ? formData.github_url : "",
            required: false,
            disabled: false
        },
        {
            name: "linkedin_url",
            label: "LinkedIn",
            value: formData.linkedin_url ? formData.linkedin_url : "",
            required: false,
            disabled: false
        }],
        [{
            name: "facebook_url",
            label: "Facebook",
            value: formData.facebook_url ? formData.facebook_url : "",
            required: false,
            disabled: false
        },
        {
            name: "instagram_url",
            label: "Instagram",
            value: formData.instagram_url ? formData.instagram_url : "",
            required: false,
            disabled: false
        },
        {
            name: "x_url",
            label: "X",
            value: formData.x_url ? formData.x_url : "",
            required: false,
            disabled: false
        }],
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }


    return (
        <form className={styles.inputForm}>
            <div className={styles.formHeader}>
                <div className={styles.headerText}>
                    <h1 className={`${headerFont.className} ${styles.formTitle}`}>User Info</h1>
                    <h3 className={styles.formSubtitle}>Update your personal details</h3>
                </div>
                <div className={styles.buttons}>
                    <ButtonFour>Cancel</ButtonFour>
                    <ButtonOne>Save</ButtonOne>
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
                                    disabled={input.disabled}
                                    onChange={handleChange}
                                    isInInputForm={true}
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
                            disabled={inputRow[0].disabled}
                            onChange={handleChange}
                            isInInputForm={true}
                        />
                    )
                ))}
            </div>
        </form>
    );
}