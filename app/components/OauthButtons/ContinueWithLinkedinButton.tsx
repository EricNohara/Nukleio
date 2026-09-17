import Image from "next/image";

import { useToast } from "@/app/context/ToastProvider";
import { OAuthButtonProps, startOauth } from "@/utils/oauth/startOauth";

import styles from "./OauthButtons.module.css";

export default function ContinueWithLinkedinButton({ captchaToken, onCaptchaConsumed }: OAuthButtonProps) {
    const toast = useToast();

    const handleLinkedin = async () => {
        if (!captchaToken) return;
        try {
            await startOauth("linkedin_oidc", captchaToken);
        } catch {
            toast.error("Error logging in with LinkedIn");
        } finally {
            onCaptchaConsumed();
        }
    };

    return (
        <button type="button" onClick={handleLinkedin} className={`${styles.button}`} disabled={!captchaToken}>
            <Image
                src="/images/linkedin-icon.svg"
                alt="LinkedIn icon"
                width={30}
                height={30}
            />
        </button>
    );
}
