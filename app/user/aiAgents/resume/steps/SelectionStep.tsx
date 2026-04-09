import { LucideIcon } from "lucide-react";
import Image from "next/image";

import CheckboxIndicator from "@/app/components/CheckboxIndicator/CheckboxIndicator";
import { titleFont } from "@/app/localFonts";

import styles from "../ResumePage.module.css";


export type SelectableItem = {
    id: string;
    label: string;
    subtitle?: string;
    imageUrl?: string;
    icon?: LucideIcon;
};

export default function SelectionStep({
    title,
    items,
    selectedIds,
    onToggle,
}: {
    title: string;
    items: SelectableItem[];
    selectedIds: string[];
    onToggle: (id: string) => void;
}) {
    return (
        <div className={styles.stepContainer}>
            <p className={styles.selectionLabel}>{title}</p>

            <div className={styles.selectionList}>
                {items.map((item) => {
                    const selected = selectedIds.includes(item.id);

                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`${styles.selectionCard} ${selected ? styles.selectedCard : ""}`}
                            onClick={() => onToggle(item.id)}
                        >
                            {item.imageUrl && (
                                <div className={styles.selectionCardBg}>
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.label}
                                        fill
                                        className={styles.selectionBgImage}
                                    />
                                    <div className={`${styles.selectionOverlay} ${selected ? styles.selectedOverlay : ""}`} />
                                </div>
                            )}

                            <div className={`${styles.selectionCardHeader} ${item.imageUrl ? styles.selectionCardDark : ""}`}>
                                <h3 className={titleFont.className}>
                                    {item.icon && <item.icon />}
                                    {item.label}
                                </h3>
                                <div className={styles.selectionCheckboxWrapper}>
                                    <CheckboxIndicator checked={selected} />
                                </div>
                            </div>

                            <div className={`${styles.selectionCardContent} ${item.imageUrl ? styles.selectionCardDark : ""}`}>
                                {item.subtitle && <span>{item.subtitle}</span>}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}