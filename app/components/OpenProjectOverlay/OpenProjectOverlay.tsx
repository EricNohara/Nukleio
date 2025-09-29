import { GitBranch, Link2 } from "lucide-react";
import Image from "next/image";

import { IProjectInternal } from "@/app/interfaces/IUserInfoInternal";
import formatDate from "@/utils/general/formatDate";

import styles from "./OpenProjectOverlay.module.css";
import { ExitButton, ButtonOne } from "../Buttons/Buttons";
import inputFormStyles from "../InputForm/InputForm.module.css";
import InputFormHeader from "../InputForm/InputFormHeader/InputFormHeader";
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
            return `${formatDate(project.date_start)}${project.date_end && ` - ${formatDate(project.date_end)}`}`;
        } else {
            return project.date_end ? formatDate(project.date_end) : "";
        }
    }

    const formatList = (list: string[] | null, fallback: string) => {
        return list && list.length > 0 ? list.join(", ") : fallback;
    }

    return (
        <Overlay onClose={onClose}>
            <div className={inputFormStyles.form} onClick={(e) => e.stopPropagation()}>
                <InputFormHeader title={project.name} onClose={onClose} />
                <div className={styles.content}>
                    <div className={styles.contentGrid}>
                        <div className={styles.thumbnailContainer}>
                            <Image
                                src={project.thumbnail_url ? project.thumbnail_url : "/images/default-project.svg"}
                                alt={project.name}
                                fill
                                className={styles.thumbnail}
                            />
                        </div>
                        <div className={styles.info}>
                            <div>
                                <h3 className={styles.date}>{getFormattedDate()}</h3>
                                <ul className={styles.csvList}>
                                    <li>
                                        <p className={`${!project.languages_used || project.languages_used.length === 0 ? styles.csvNone : ""}`}>
                                            {formatList(project.languages_used, "No languages")}
                                        </p>
                                    </li>
                                    <li>
                                        <p className={`${!project.frameworks_used || project.frameworks_used.length === 0 ? styles.csvNone : ""}`}>
                                            {formatList(project.frameworks_used, "No frameworks")}
                                        </p>
                                    </li>
                                    <li>
                                        <p className={`${!project.technologies_used || project.technologies_used.length === 0 ? styles.csvNone : ""}`}>
                                            {formatList(project.technologies_used, "No technologies")}
                                        </p>
                                    </li>

                                </ul>
                            </div>
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
                        <div className={styles.description}>
                            <p>{project.description}</p>
                        </div>
                    </div>
                    <div className={styles.buttonContainer}>
                        <ButtonOne onClick={() => onEdit(index)}>Edit</ButtonOne>
                        <ExitButton className={styles.deleteBtn} onClick={() => onDelete(index)}>Delete</ExitButton>
                    </div>
                </div>
            </div>
        </Overlay>
    );
}