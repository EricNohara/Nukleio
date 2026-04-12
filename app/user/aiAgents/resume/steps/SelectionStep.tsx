import { LucideIcon } from "lucide-react";
import Image from "next/image";

import CheckboxIndicator from "@/app/components/CheckboxIndicator/CheckboxIndicator";
import { titleFont } from "@/app/localFonts";

import styles from "../ResumePage.module.css";


export type SelectableItem = {
    id: string;
    label: string;
    subtitle?: string;
    footer?: string;
    imageUrl?: string;
    icon?: LucideIcon;
};

export default function SelectionStep({
    title,
    items,
    selectedIds,
    onToggle,
    allSelected,
    onToggleAll,
}: {
    title: string;
    items: SelectableItem[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    allSelected: boolean;
    onToggleAll: () => void;
}) {
    return (
        <div className={styles.stepContainer}>
            <div className={styles.selectionTopRow}>
                <p className={styles.selectionLabel}>{title}</p>

                <button
                    type="button"
                    className={styles.selectAllButton}
                    onClick={onToggleAll}
                >
                    <span>{allSelected ? "Deselect All" : "Select All"}</span>
                    <CheckboxIndicator checked={allSelected} />
                </button>
            </div>

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

                            <div>
                                <div className={styles.selectionCardHeader}>
                                    <h3 className={`${titleFont.className} ${item.imageUrl ? styles.selectionCardDark : ""}`}>
                                        {item.icon && <item.icon />}
                                        {item.label}
                                    </h3>
                                    <div className={styles.selectionCheckboxWrapper}>
                                        <CheckboxIndicator checked={selected} />
                                    </div>
                                </div>
                                {item.subtitle && <p className={`${styles.itemContentSubtitle} ${item.imageUrl ? styles.selectionCardDarkContent : ""}`}>{item.subtitle}</p>}
                            </div>

                            {item.footer && <p className={`${styles.itemContentFooter} ${item.imageUrl ? styles.selectionCardDarkContent : ""}`}>{item.footer}</p>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}