import styles from "./PDFThumbnail.module.css";

interface IPDFThumbnailProps {
    pdfUrl: string;
    title: string;
}

export default function PDFThumbnail({ pdfUrl, title }: IPDFThumbnailProps) {
    return (
        <iframe
            src={`${pdfUrl}#page=1&zoom=page-width&toolbar=0&navpanes=0&scrollbar=0`}
            title={title}
            className={styles.preview}
        />
    );
}