"use client";

import { BadgeCheck, Bot, CircleDollarSign, Hammer } from "lucide-react";

import CheckboxIndicator from "@/app/components/CheckboxIndicator/CheckboxIndicator";
import { headerFont, titleFont } from "@/app/localFonts";

import styles from "../ResumePage.module.css";

type GenerationType = "generate" | "generateAi";

type StartStepProps = {
    generationType: GenerationType;
    manualModeBenefits: string[];
    aiModeBenefits: string[];
    onSelectGenerationType: (type: GenerationType) => void;
};

export default function StartStep({
    generationType,
    manualModeBenefits,
    aiModeBenefits,
    onSelectGenerationType,
}: StartStepProps) {
    return (
        <div className={styles.stepContainer}>
            <p className={styles.selectionLabel}>Generation Mode</p>

            <div className={styles.modeCards}>
                <ModeCard
                    icon={<Hammer size={30} />}
                    selected={generationType === "generate"}
                    title="Manual Selection"
                    subtitle="Best for cheap templating"
                    tokenCost="1"
                    benefits={manualModeBenefits}
                    onClick={() => onSelectGenerationType("generate")}
                />

                <ModeCard
                    icon={<Bot size={30} />}
                    selected={generationType === "generateAi"}
                    title="AI Enhanced"
                    subtitle="Best for highest quality"
                    tokenCost="10"
                    benefits={aiModeBenefits}
                    onClick={() => onSelectGenerationType("generateAi")}
                />
            </div>
        </div>
    );
}

type ModeCardProps = {
    icon: React.ReactNode;
    selected: boolean;
    title: string;
    subtitle: string;
    tokenCost: string;
    benefits: string[];
    onClick: () => void;
};

function ModeCard({
    icon,
    selected,
    title,
    subtitle,
    tokenCost,
    benefits,
    onClick,
}: ModeCardProps) {
    return (
        <button
            type="button"
            className={`${styles.modeCard} ${selected ? styles.selectedCard : ""}`}
            onClick={onClick}
        >
            <div className={styles.modeIconsRow}>
                <div className={`${styles.modeIcon} ${selected ? styles.selectedModeIcon : ""}`}>
                    {icon}
                </div>
                <CheckboxIndicator checked={selected} />
            </div>

            <div className={styles.modeContentContainer}>
                <h3 className={headerFont.className}>{title}</h3>
                <h4 className={headerFont.className}>{subtitle}</h4>

                <div className={styles.modeTokens}>
                    <CircleDollarSign size={60} strokeWidth={2.5} />
                    <h1 className={titleFont.className}>{tokenCost}</h1>
                </div>

                <ul className={styles.benefitsList}>
                    {benefits.map((benefit) => (
                        <li key={benefit}>
                            <BadgeCheck color={selected ? "white" : "var(--btn-1)"} />
                            <span>{benefit}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </button>
    );
}