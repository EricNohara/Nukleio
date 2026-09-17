import Image from "next/image";

import { useToast } from "@/app/context/ToastProvider";
import { OAuthButtonProps, startOauth } from "@/utils/oauth/startOauth";

import styles from "./OauthButtons.module.css";

export default function ContinueWithAzureButton({ captchaToken, onCaptchaConsumed }: OAuthButtonProps) {
    const toast = useToast();

    const handleAzure = async () => {
        if (!captchaToken) return;
        try {
            await startOauth("azure", captchaToken);
        } catch {
            toast.error("Error logging in with Azure");
        } finally {
            onCaptchaConsumed();
        }
    };

    return (
        <button type="button" onClick={handleAzure} className={`${styles.button}`} disabled={!captchaToken}>
            <Image
                src="/images/microsoft-icon.svg"
                alt="Azure icon"
                width={30}
                height={30}
            />
        </button>
    );
}
