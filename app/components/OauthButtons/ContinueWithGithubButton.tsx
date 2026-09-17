import Image from "next/image";

import { useToast } from "@/app/context/ToastProvider";
import { OAuthButtonProps, startOauth } from "@/utils/oauth/startOauth";

import styles from "./OauthButtons.module.css";

export default function ContinueWithGithubButton({ captchaToken, onCaptchaConsumed }: OAuthButtonProps) {
    const toast = useToast();

    const handleGithub = async () => {
        if (!captchaToken) return;
        try {
            await startOauth("github", captchaToken);
        } catch {
            toast.error("Error logging in with GitHub");
        } finally {
            onCaptchaConsumed();
        }
    };

    return (
        <button type="button" onClick={handleGithub} className={`${styles.button}`} disabled={!captchaToken}>
            <Image
                src="/images/github-icon.svg"
                alt="GitHub icon"
                width={30}
                height={30}
            />
        </button>
    );
}
