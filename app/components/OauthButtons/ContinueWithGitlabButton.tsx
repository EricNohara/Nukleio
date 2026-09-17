import Image from "next/image";

import { useToast } from "@/app/context/ToastProvider";
import { OAuthButtonProps, startOauth } from "@/utils/oauth/startOauth";

import styles from "./OauthButtons.module.css";

export default function ContinueWithGitlabButton({ captchaToken, onCaptchaConsumed }: OAuthButtonProps) {
    const toast = useToast();

    const handleGitlab = async () => {
        if (!captchaToken) return;
        try {
            await startOauth("gitlab", captchaToken);
        } catch {
            toast.error("Error logging in with GitLab");
        } finally {
            onCaptchaConsumed();
        }
    };

    return (
        <button type="button" onClick={handleGitlab} className={`${styles.button}`} disabled={!captchaToken}>
            <Image
                src="/images/gitlab-icon.svg"
                alt="Gitlab icon"
                width={30}
                height={30}
            />
        </button>
    );
}
