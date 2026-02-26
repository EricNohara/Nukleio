import { TriangleAlert, Copy, Eye, EyeClosed } from "lucide-react";
import { useState, useEffect } from "react";

import { useToast } from "@/app/context/ToastProvider";

import styles from "./ApiKeyDisplay.module.css";
import { ButtonOne } from "../Buttons/Buttons";
import inputFormStyles from "../InputForm/InputForm.module.css";
import InputFormHeader from "../InputForm/InputFormHeader/InputFormHeader";
import Overlay from "../Overlay/Overlay";
import textInputStyles from "../TextInput/TextInput.module.css";

export interface IApiKeyDisplayProps {
    keyDescription: string;
    onClose: () => void;
}

export default function ApiKeyDisplay({ keyDescription, onClose }: IApiKeyDisplayProps) {
    const [key, setKey] = useState<string>("Loading key...");
    const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);
    const toast = useToast();

    useEffect(() => {
        const fetchKeyValue = async () => {
            try {
                const res = await fetch(`/api/internal/user/key/encryptedKey?description=${keyDescription}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                if (!data) throw new Error("Missing data");

                setKey(data.encryptedKey);
            } catch (err) {
                const error = err as Error;
                toast.error("Error", `Error displaying API key: ${error.message}.`)
            }
        };

        fetchKeyValue();
    }, [keyDescription, toast]);

    const handleCopy = async () => {
        if (key === "Loading key...") return;
        try {
            await navigator.clipboard.writeText(key);
            toast.info("Copied to clipboard")
        } catch {
            toast.error("Failed to copy")
        }
    };

    const handleDownload = () => {
        if (key === "Loading key...") return;

        // Construct the .env file contents
        const envContent = `API_KEY=${key}\n`;

        // Create a Blob with the contents
        const blob = new Blob([envContent], { type: "text/plain" });

        // Create a temporary download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = ".env"; // filename
        a.click();

        // Clean up
        URL.revokeObjectURL(url);

        toast.info("Download initialized")
    };

    const handleVisibleClick = () => {
        setIsKeyVisible(!isKeyVisible);
    };

    const formatHidden = (s: string) => {
        return s.replace(/./g, '*');
    };

    return (
        <Overlay onClose={onClose}>
            <div className={inputFormStyles.form} onClick={(e) => e.stopPropagation()}>
                <InputFormHeader title="API Key Generated" onClose={onClose} />
                <div className={styles.inputContainer}>
                    <div className={inputFormStyles.inputRow}>
                        <div className={textInputStyles.inputDiv}>
                            <label className={textInputStyles.inputLabel}>Access Key</label>
                            <div className={styles.keyValueContainer}>
                                <p>{isKeyVisible ? key : formatHidden(key)}</p>
                                {isKeyVisible ? <EyeClosed className={styles.eyeIcon} onClick={handleVisibleClick} /> : <Eye className={styles.eyeIcon} onClick={handleVisibleClick} />}
                            </div>
                        </div>
                    </div>
                    <ButtonOne className={styles.copyButton} onClick={handleCopy}><Copy size={18} /></ButtonOne>
                </div>
                <div className={styles.disclaimerContainer}>
                    <div className={styles.disclaimer}>
                        <TriangleAlert size={52} color="var(--btn-1)" />
                        <p className={styles.disclaimerText}>
                            This key is shown only once. Save it now — you can regenerate a new key anytime.
                        </p>
                    </div>
                </div>
                <div className={inputFormStyles.buttonContainer}>
                    <ButtonOne type="submit" onClick={handleDownload}>Download</ButtonOne>
                </div>
            </div>
        </Overlay>
    );
}