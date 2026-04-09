"use client";

import Image from "next/image";

import CheckboxIndicator from "@/app/components/CheckboxIndicator/CheckboxIndicator";
import { titleFont } from "@/app/localFonts";

import styles from "../ResumePage.module.css";

type Template = {
    id: string;
    name: string;
    imageUrl: string;
};

type TemplateStepProps = {
    templates: Template[];
    selectedTemplateId: string;
    onSelectTemplate: (id: string) => void;
};

export default function TemplateStep({
    templates,
    selectedTemplateId,
    onSelectTemplate,
}: TemplateStepProps) {
    return (
        <div className={styles.stepContainer}>
            <p className={styles.selectionLabel}>Resume Template</p>

            <div className={styles.templateGrid}>
                {templates.map((template) => {
                    const selected = selectedTemplateId === template.id;

                    return (
                        <button
                            key={template.id}
                            type="button"
                            className={`${styles.templateCard} ${selected ? styles.selectedCard : ""}`}
                            onClick={() => onSelectTemplate(template.id)}
                        >
                            <div className={styles.templateHeader}>
                                <h3 className={titleFont.className}>{template.name}</h3>
                                <CheckboxIndicator checked={selected} />
                            </div>
                            <div className={styles.templateImagePlaceholder}>
                                <Image
                                    src={template.imageUrl}
                                    alt={template.name}
                                    fill
                                    className={styles.templateImage}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}