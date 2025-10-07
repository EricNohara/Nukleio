import { Pencil, Trash } from "lucide-react";
import Image from "next/image";

import styles from "./FileDisplayBox.module.css";
import { ButtonOne, DeleteButton } from "../Buttons/Buttons";
import PDFThumbnail from "../PDFThumbnail/PDFThumbnail";

interface IFileDisplayBoxProps {
    imageUrl?: string;
    alt?: string;
    pdfUrl?: string;
    uploadedItemName: string;
    onEdit: (docType: string | undefined) => void;
    onDelete: (url: string | undefined, docType: string | undefined) => Promise<void>;
}

export default function FileDisplayBox({ imageUrl, alt, pdfUrl, uploadedItemName, onEdit, onDelete }: IFileDisplayBoxProps) {
    // maps a name to the correct field
    const getDocType = () => {
        switch (uploadedItemName) {
            case "Profile Picture":
                return "portrait_url";
            case "Resume":
                return "resume_url";
            case "Transcript":
                return "transcript_url";
            default:
                return undefined;
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.badgeContainer}>
                <div className={styles.badge}>Uploaded</div>
            </div>
            <div className={styles.contentContainer}>
                <div className={styles.headerContainer}>
                    <h1 className={styles.title}>{`Uploaded ${uploadedItemName}`}</h1>
                    <h2 className={styles.subTitle}>Click buttons to edit or delete</h2>
                </div>
                {
                    imageUrl && alt ?
                        <div className={styles.previewImageContainer}>
                            <Image className={styles.previewImage} src={imageUrl} alt={alt} fill />
                        </div>
                        : pdfUrl?.endsWith(".pdf") ?
                            <PDFThumbnail pdfUrl={pdfUrl} title={`${uploadedItemName} PDF Preview`} /> : null
                }
                <div className={styles.buttonsContainer}>
                    <ButtonOne onClick={() => onEdit(getDocType())} className={styles.editBtn}><Pencil /></ButtonOne>
                    <DeleteButton onClick={() => onDelete(imageUrl, getDocType())}><Trash /></DeleteButton>
                </div>
            </div>
        </div>
    );
}