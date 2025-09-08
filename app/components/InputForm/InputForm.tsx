import { X } from "lucide-react";
import { ChangeEvent } from "react";

import styles from "./InputForm.module.css";
import { ButtonOne, ExitButton } from "../Buttons/Buttons";
import TextInput from "../TextInput/TextInput";

export interface IInputFormInput {
    label: string;
    name: string;
    value: string;
    type: string;
    placeholder: string;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    required?: boolean;
    textAreaRows?: number;
}

export interface IInputFormRow {
    inputOne: IInputFormInput;
    inputTwo?: IInputFormInput | null;
}

export interface IInputFormProps {
    inputRows: IInputFormRow[];
    title: string;
    buttonLabel: string;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}

export default function InputForm({ inputRows, title, buttonLabel, onSubmit, onClose }: IInputFormProps) {
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <form
                onSubmit={onSubmit}
                className={styles.form}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e: React.KeyboardEvent<HTMLFormElement>) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.requestSubmit();
                    }
                }}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{title}</h1>
                    <ExitButton onClick={onClose}><X size={15} /></ExitButton>
                </header>
                <div className={styles.inputRowsContainer}>
                    {inputRows.map((row, i) => (
                        <div className={styles.inputRow} key={i}>
                            <TextInput
                                label={row.inputOne.label}
                                name={row.inputOne.name}
                                value={row.inputOne.value}
                                type={row.inputOne.type}
                                placeholder={row.inputOne.placeholder}
                                onChange={row.inputOne.onChange}
                                required={row.inputOne.required}
                                isInInputForm={true}
                                textAreaRows={row.inputOne.textAreaRows}
                            />
                            {
                                row.inputTwo &&
                                <TextInput
                                    label={row.inputTwo.label}
                                    name={row.inputTwo.name}
                                    value={row.inputTwo.value}
                                    type={row.inputTwo.type}
                                    placeholder={row.inputTwo.placeholder}
                                    onChange={row.inputTwo.onChange}
                                    required={row.inputTwo.required}
                                    isInInputForm={true}
                                    textAreaRows={row.inputTwo.textAreaRows}
                                />
                            }
                        </div>
                    ))}
                </div>
                <div className={styles.buttonContainer}>
                    <ButtonOne type="submit">{buttonLabel}</ButtonOne>
                </div>
            </form>
        </div>
    );
}