"use client";

import React, { Dispatch, FormEvent, SetStateAction, useState } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import AutocompleteListSelector from "@/app/components/AutocompleteListSelector/AutocompleteListSelector";
import { ButtonOne } from "@/app/components/Buttons/Buttons";
import FileUploadBox from "@/app/components/FileUploadBox/FileUploadBox";
import InputFormHeader from "@/app/components/InputForm/InputFormHeader/InputFormHeader";
import Overlay from "@/app/components/Overlay/Overlay";
import TextInput from "@/app/components/TextInput/TextInput";
import { useToast } from "@/app/context/ToastProvider";
import { IProjectInput } from "@/app/interfaces/IProject";
import FRAMEWORKS from "@/data/frameworks.json";
import LANGUAGES from "@/data/languages.json";
import TECHNOLOGIES from "@/data/technologies.json";

import styles from "./ProjectsPage.module.css";


type Props = {
    title: string;
    submitLabel: string;
    value: IProjectInput;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    setThumbnailDoc: Dispatch<SetStateAction<File | null>>;
};

export default function ProjectFormModal({
    title,
    submitLabel,
    value,
    onChange,
    onSubmit,
    onClose,
    setThumbnailDoc
}: Props) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const toast = useToast();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        onSubmit(e);
    };

    const handleFileSelect = (file: File, _: string) => {
        setThumbnailDoc(file);
        toast.info("Info", "Project thumbnail uploaded. Click the save button to save your new thumbnail.");
    };

    return (
        <Overlay onClose={onClose}>
            <form className={styles.modal} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <InputFormHeader title={title} onClose={onClose} />

                <div className={styles.inputGrid}>
                    <TextInput
                        label="Project Name"
                        name="name"
                        value={value.name}
                        type="text"
                        placeholder="e.g. Nukleio"
                        onChange={onChange}
                        required
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                        outerClassname={styles.name}
                    />

                    <TextInput
                        label="Start Date"
                        name="date_start"
                        value={value.date_start}
                        type="date"
                        onChange={onChange}
                        required
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                        outerClassname={styles.start}
                    />

                    <TextInput
                        label="End Date"
                        name="date_end"
                        value={value.date_end}
                        type="date"
                        onChange={onChange}
                        required
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                        outerClassname={styles.end}
                    />

                    <TextInput
                        label="GitHub URL"
                        name="github_url"
                        value={value.github_url ?? ""}
                        type="text"
                        placeholder="https://github.com/..."
                        onChange={onChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                        outerClassname={styles.github}
                    />

                    <TextInput
                        label="Demo URL"
                        name="demo_url"
                        value={value.demo_url ?? ""}
                        type="text"
                        placeholder="https://..."
                        onChange={onChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                        outerClassname={styles.demo}
                    />

                    <AutocompleteListSelector
                        label="Programming Languages"
                        name="languages_used"
                        value={value.languages_used ?? []}
                        suggestionsData={LANGUAGES}
                        onChange={onChange}
                        placeholder="TypeScript, Python, ..."
                        className={styles.langs}
                    />

                    <AutocompleteListSelector
                        label="Frameworks"
                        name="frameworks_used"
                        value={value.frameworks_used ?? []}
                        suggestionsData={FRAMEWORKS}
                        onChange={onChange}
                        placeholder="Next.js, Django, ..."
                        className={styles.frameworks}
                    />

                    <AutocompleteListSelector
                        label="Technologies"
                        name="technologies_used"
                        value={value.technologies_used ?? []}
                        suggestionsData={TECHNOLOGIES}
                        onChange={onChange}
                        placeholder="Supabase, Stripe, ..."
                        className={styles.tech}
                    />

                    <TextInput
                        label="Project Description"
                        name="description"
                        value={value.description}
                        required
                        type="textarea"
                        placeholder="What did you build? How did you build it?"
                        onChange={onChange}
                        isInInputForm={true}
                        focusLabelColor="var(--btn-1)"
                        textAreaRows={10}
                        outerClassname={styles.desc}
                    />

                    <FileUploadBox
                        onFileSelect={handleFileSelect}
                        docType="project_thumbnails"
                        accepts="image/*"
                        className={styles.upload}
                        label="Project Thumbnail"
                        isMini
                    />
                </div>

                <div className={styles.buttonContainer}>
                    <ButtonOne type="submit" disabled={isLoading}>
                        <LoadableButtonContent isLoading={isLoading} buttonLabel={submitLabel} />
                    </ButtonOne>
                </div>
            </form>
        </Overlay>
    );
}
