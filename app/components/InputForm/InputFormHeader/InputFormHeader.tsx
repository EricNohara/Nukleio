import { X } from "lucide-react";

import { headerFont } from "@/app/localFonts";

import styles from "./InputFormHeader.module.css";
import { ExitButton } from "../../Buttons/Buttons";

interface IInputFormHeaderProps {
    title: string;
    onClose: () => void
}

export default function InputFormHeader({ title, onClose }: IInputFormHeaderProps) {
    return (
        <header className={styles.header}>
            <h1 className={`${styles.title} ${headerFont.className}`}>{title}</h1>
            <ExitButton onClick={onClose}><X size={15} /></ExitButton>
        </header>
    );
}