import styles from "./ApiKeyDisplay.module.css";
import inputFormStyles from "../InputForm/InputForm.module.css";
import { ExitButton, ButtonOne } from "../Buttons/Buttons";
import TextInput from "../TextInput/TextInput";
import { useState, useEffect } from "react";
import { TriangleAlert, X } from "lucide-react";

export interface IApiKeyDisplayProps {
    keyDescription: string;
    onClose: () => void;
}

export default function ApiKeyDisplay({ keyDescription, onClose }: IApiKeyDisplayProps) {
    const [key, setKey] = useState<string>("Loading key...");

    useEffect(() => {
        const fetchKeyValue = async () => {
            try {
                const res = await fetch(`/api/internal/user/key/encryptedKey?description=${keyDescription}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                if (!data) throw new Error("Missing data");

                setKey(data.encryptedKey);
            } catch (error) {
                console.error(error);
                alert(error);
            }
        }

        fetchKeyValue();
    }, [keyDescription])

    return (
        <div className={inputFormStyles.overlay}>
            <div className={inputFormStyles.form}>
                <header className={inputFormStyles.header}>
                    <h1 className={inputFormStyles.title}>API Key Generated</h1>
                    <ExitButton onClick={onClose}><X size={15} /></ExitButton>
                </header>
                <div className={inputFormStyles.inputRowsContainer}>
                    <div className={inputFormStyles.inputRow}>
                        <TextInput
                            label="Access Key"
                            name="key"
                            value={""}
                            type="text"
                            placeholder={key}
                            onChange={() => { }}
                            isInInputForm={true}
                            disabled={true}
                        />
                    </div>
                </div>
                <div className={styles.disclaimerContainer}>
                    <div className={styles.disclaimer}>
                        <TriangleAlert size={52} color="orange" strokeWidth={3} />
                        <p className={styles.disclaimerText}>
                            Here is your newly generated API Key. This is the only time the token will ever be displayed, so be sure to copy or download it for later! You may regenerate a new API key at any time if this key is lost or compromised.
                        </p>
                    </div>
                </div>
                <div className={inputFormStyles.buttonContainer}>
                    <ButtonOne type="submit">Download</ButtonOne>
                </div>
            </div>
        </div>
    );
}