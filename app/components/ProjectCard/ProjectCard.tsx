"use client";

import { EllipsisVertical } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { IProjectInternal } from "@/app/interfaces/IUserInfoInternal";
import formatDate from "@/utils/general/formatDate";

import styles from "./ProjectCard.module.css";

interface IProjectCardProps {
    project: IProjectInternal;
}

export default function ProjectCard({ project }: IProjectCardProps) {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const getFormattedDate = (): string => {
        if (project.date_start) {
            return `${formatDate(project.date_start)}${project.date_end && ` - ${formatDate(project.date_end)}`}`;
        } else {
            return project.date_end ? formatDate(project.date_end) : "";
        }
    }

    return (
        <div className={styles.cardContainer}>
            <div className={styles.headerContainer}>
                <h2 className={styles.title}>{project.name}</h2>
                <button className={styles.expandBtn}>
                    <EllipsisVertical />
                </button>
            </div>
            <Image
                className={styles.thumbnail}
                src={project.thumbnail_url ? project.thumbnail_url : "/images/default-project.svg"}
                alt={project.name}
            />
            <p className={styles.date}>{getFormattedDate()}</p>
        </div>
    );
}