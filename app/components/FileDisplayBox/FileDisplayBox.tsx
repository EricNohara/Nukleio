import { Pencil, Trash } from "lucide-react";
import Image from "next/image";

import { headerFont } from "@/app/localFonts";

import styles from "./FileDisplayBox.module.css";
import { AsyncButtonWrapper } from "../AsyncButtonWrapper/AsyncButtonWrapper";
import { ButtonOne, DeleteButton } from "../Buttons/Buttons";
import PDFThumbnail from "../PDFThumbnail/PDFThumbnail";

interface IFileDisplayBoxProps {
    imageUrl?: string;
    alt?: string;
    pdfUrl?: string;
    uploadedItemName: string;
    docType: string;
    onEdit: (docType: string | undefined) => void;
    onDelete: (url: string | undefined, docType: string | undefined) => Promise<void>;
}

export default function FileDisplayBox({ imageUrl, alt, pdfUrl, uploadedItemName, docType, onEdit, onDelete }: IFileDisplayBoxProps) {
    return (
        <div className={styles.container}>
            <div className={styles.badgeContainer}>
                <div className={`${styles.badge} ${headerFont.className}`}>Uploaded</div>
            </div>
            <div className={styles.contentContainer}>
                <div className={styles.headerContainer}>
                    <h1 className={`${styles.title} ${headerFont.className}`}>{`Uploaded ${uploadedItemName}`}</h1>
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
                    <ButtonOne onClick={() => onEdit(docType)} className={styles.editBtn}><Pencil /></ButtonOne>
                    <AsyncButtonWrapper
                        button={<DeleteButton><Trash /></DeleteButton>}
                        onClick={() => onDelete(imageUrl, docType)}
                    />
                </div>
            </div>
        </div >
    );
}