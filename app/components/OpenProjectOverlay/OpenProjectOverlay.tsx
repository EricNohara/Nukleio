import { X, GitBranch, Link2 } from "lucide-react";
import Image from "next/image";

import { IProjectInternal } from "@/app/interfaces/IUserInfoInternal";
import formatDate from "@/utils/general/formatDate";

import styles from "./OpenProjectOverlay.module.css";
import { ExitButton, ButtonOne } from "../Buttons/Buttons";
import Overlay from "../Overlay/Overlay";



interface IOpenProjectOverlayProps {
    project: IProjectInternal;
    index: number;
    onEdit: (n: number) => void;
    onDelete: (n: number) => Promise<void>;
    onClose: () => void
}

export default function OpenProjectOverlay({ project, index, onEdit, onDelete, onClose }: IOpenProjectOverlayProps) {
    const getFormattedDate = (): string => {
        if (project.date_start) {
            return `${formatDate(project.date_start, true)}${project.date_end && ` - ${formatDate(project.date_end)}`}`;
        } else {
            return project.date_end ? formatDate(project.date_end, true) : "";
        }
    }

    const formatList = (list: string[] | null, fallback: string) => {
        return list && list.length > 0 ? list.join(", ") : fallback;
    }

    return (
        <Overlay onClose={onClose}>
            <div className={styles.projectContainer}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{project.name}</h1>
                    <ExitButton onClick={onClose}><X size={15} /></ExitButton>
                </header>
                <div className={styles.content}>
                    <div className={styles.contentRow}>
                        <div className={styles.thumbnailContainer}>
                            <Image
                                src={project.thumbnail_url ? project.thumbnail_url : "/images/default-project.svg"}
                                alt={project.name}
                                fill
                                className={styles.thumbnail}
                            />
                        </div>
                        <div className={styles.info}>
                            <h3 className={styles.date}>{getFormattedDate()}</h3>
                            <ul className={styles.csvList}>
                                <li>{formatList(project.languages_used, "No languages")}</li>
                                <li>{formatList(project.frameworks_used, "No frameworks")}</li>
                                <li>{formatList(project.technologies_used, "No technologies")}</li>

                            </ul>
                            {
                                (project.github_url || project.demo_url) &&
                                <div className={styles.iconLinks}>
                                    {project.github_url &&
                                        <a
                                            className={styles.iconLink}
                                            href={project.github_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <GitBranch />
                                        </a>
                                    }
                                    {project.demo_url &&
                                        <a
                                            className={styles.iconLink}
                                            href={project.demo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Link2 />
                                        </a>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                    <div className={styles.description}>
                        <p>{project.description}</p>
                    </div>
                    <div className={styles.buttonContainer}>
                        <ButtonOne onClick={() => onEdit(index)}>Edit</ButtonOne>
                        <ExitButton onClick={() => onDelete(index)}>Delete</ExitButton>
                    </div>
                </div>
            </div>
        </Overlay>
    );
}