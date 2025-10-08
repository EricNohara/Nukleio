"use client";

import { ChangeEvent } from "react";
import { useState, FormEvent, useRef } from "react";

import styles from "./InputForm.module.css";
import { ButtonOne } from "../Buttons/Buttons";
import Overlay from "../Overlay/Overlay";
import TextInput from "../TextInput/TextInput";
import InputFormHeader from "./InputFormHeader/InputFormHeader";
import { AsyncButtonWrapper } from "../AsyncButtonWrapper/AsyncButtonWrapper";

export interface IInputFormInput {
    label: string;
    name: string;
    value: string;
    type: string;
    placeholder: string;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    required?: boolean;
    textAreaRows?: number;
    disabled?: boolean;
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
    const [isDisabled, setIsDisabled] = useState<boolean>(false);
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <Overlay onClose={onClose}>
            <form
                ref={formRef}
                onSubmit={(e: FormEvent<HTMLFormElement>) => { onSubmit(e); setIsDisabled(false) }}
                className={styles.form}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e: React.KeyboardEvent<HTMLFormElement>) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.requestSubmit();
                    }
                }}
            >
                <InputFormHeader title={title} onClose={onClose} />
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
                                disabled={row.inputOne.disabled}
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
                                    disabled={row.inputOne.disabled}
                                />
                            }
                        </div>
                    ))}
                </div>
                <div className={styles.buttonContainer}>
                    <AsyncButtonWrapper
                        button={<ButtonOne type="button">{buttonLabel}</ButtonOne>}
                        onClick={() => { setIsDisabled(true); formRef.current?.requestSubmit() }}
                        isDisabled={isDisabled}
                    />
                </div>
            </form>
        </Overlay>
    );
}