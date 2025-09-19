import { TriangleAlert, X, Copy, Eye, EyeClosed } from "lucide-react";
import { useState, useEffect } from "react";

import styles from "./ApiKeyDisplay.module.css";
import { ExitButton, ButtonOne } from "../Buttons/Buttons";
import inputFormStyles from "../InputForm/InputForm.module.css";
import textInputStyles from "../TextInput/TextInput.module.css";

export interface IApiKeyDisplayProps {
    keyDescription: string;
    onClose: () => void;
}

export default function ApiKeyDisplay({ keyDescription, onClose }: IApiKeyDisplayProps) {
    const [key, setKey] = useState<string>("Loading key...");
    const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);
    // const [copyStatus, setCopyStatus] = useState<string>("");

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
    }, [keyDescription]);

    const handleCopy = async () => {
        if (key === "Loading key...") return;
        try {
            await navigator.clipboard.writeText(key);
            // setCopyStatus('Copied to clipboard!');
            // setTimeout(() => setCopyStatus(""), 2000);
        } catch (error) {
            // setCopyStatus("Failed to copy!");
            console.error(error);
        }
    }

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
    }

    const handleVisibleClick = () => {
        setIsKeyVisible(!isKeyVisible);
    }

    const formatHidden = (s: string) => {
        return s.replace(/./g, '*');
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={inputFormStyles.overlay} onClick={handleOverlayClick}>
            <div className={inputFormStyles.form} onClick={(e) => e.stopPropagation()}>
                <header className={inputFormStyles.header}>
                    <h1 className={inputFormStyles.title}>API Key Generated</h1>
                    <ExitButton onClick={onClose}><X size={15} /></ExitButton>
                </header>
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
                            This is the only time the newly generated key will ever be displayed so make sure to copy or download it for later! You may regenerate a new API key at any time if this key is lost or compromised.
                        </p>
                    </div>
                </div>
                <div className={inputFormStyles.buttonContainer}>
                    <ButtonOne type="submit" onClick={handleDownload}>Download</ButtonOne>
                </div>
            </div>
        </div>
    );
}