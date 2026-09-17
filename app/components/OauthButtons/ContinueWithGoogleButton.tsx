import Image from "next/image";

import { useToast } from "@/app/context/ToastProvider";
import { OAuthButtonProps, startOauth } from "@/utils/oauth/startOauth";

import styles from "./OauthButtons.module.css";

export default function ContinueWithGoogleButton({ captchaToken, onCaptchaConsumed }: OAuthButtonProps) {
    const toast = useToast();

    const handleGoogle = async () => {
        if (!captchaToken) return;
        try {
            await startOauth("google", captchaToken);
        } catch {
            toast.error("Error logging in with Google");
        } finally {
            onCaptchaConsumed();
        }
    };

    return (
        <button type="button" onClick={handleGoogle} className={`${styles.button}`} disabled={!captchaToken}>
            <Image
                src="/images/google-icon.svg"
                alt="Google icon"
                width={30}
                height={30}
            />
        </button>
    );
}
