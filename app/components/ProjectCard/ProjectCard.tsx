"use client";

import { Maximize, Pencil, Trash, EllipsisVertical } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

import { IProjectInternal } from "@/app/interfaces/IUserInfoInternal";
import { headerFont } from "@/app/localFonts";
import formatDate from "@/utils/general/formatDate";

import styles from "./ProjectCard.module.css";

interface IProjectCardProps {
    project: IProjectInternal;
    onEdit: (n: number) => void;
    onDelete: (n: number) => Promise<void>;
    onOpen: (n: number) => void;
    index: number;
    isActive: boolean;
    onSingleClick: (n: number) => void;
}

export default function ProjectCard({ project, onEdit, onDelete, onOpen, index, isActive, onSingleClick }: IProjectCardProps) {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // close menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getFormattedDate = (): string => {
        if (project.date_start) {
            return `${formatDate(project.date_start, true)}${project.date_end && ` - ${formatDate(project.date_end, true)}`}`;
        } else {
            return project.date_end ? formatDate(project.date_end, true) : "";
        }
    }

    return (
        <div
            className={`${styles.cardContainer} ${isActive && styles.cardContainerActive}`}
            onClick={() => onSingleClick(index)}
            onDoubleClick={() => onOpen(index)}
        >
            <div className={styles.headerContainer}>
                <div className={styles.titleContainer}>
                    <h2 className={`${styles.title} ${headerFont.className}`}>{project.name}</h2>
                </div>
                <div className={styles.dropdownWrapper} ref={menuRef}>
                    <button
                        className={`${styles.expandBtn} ${isExpanded && styles.expandBtnActive}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSingleClick(index);
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        <EllipsisVertical />
                    </button>
                    {isExpanded && (
                        <div className={styles.dropdownMenu}>
                            <button className={`${styles.dropdownButton} ${headerFont.className}`} onClick={() => onOpen(index)}>
                                Open
                                <Maximize strokeWidth={1.5} />
                            </button>
                            <button className={`${styles.dropdownButton} ${headerFont.className}`} onClick={() => onEdit(index)}>
                                Edit
                                <Pencil strokeWidth={1.5} />
                            </button>
                            <button className={`${styles.dropdownButton} ${headerFont.className}`} onClick={async () => await onDelete(index)}>
                                Delete
                                <Trash strokeWidth={1.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.thumbnailContainer}>
                <Image
                    className={styles.thumbnail}
                    src={project.thumbnail_url ? project.thumbnail_url : "/images/default-project.svg"}
                    alt={project.name}
                    fill
                />
            </div>
            <i className={`${styles.date} ${headerFont.className}`}>{getFormattedDate()}</i>
        </div>
    );
}