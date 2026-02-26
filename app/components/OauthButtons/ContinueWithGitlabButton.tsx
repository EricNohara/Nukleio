import Image from "next/image";

import { useToast } from "@/app/context/ToastProvider";
import { createClient } from "@/utils/supabase/client";

import styles from "./OauthButtons.module.css";

export default function ContinueWithGitlabButton() {
    const supabase = createClient();
    const toast = useToast();

    const handleGitlab = async () => {
        const base = process.env.NEXT_PUBLIC_SITE_URL;
        const redirectTo = `${base}/api/internal/auth/callback?provider=gitlab&next=${encodeURIComponent("/user")}`;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "gitlab",
            options: { redirectTo },
        });

        if (error) toast.error("Error logging in with GitLab")
    };

    return (
        <button onClick={handleGitlab} className={`${styles.button}`}>
            <Image
                src="/images/gitlab-icon.svg"
                alt="Gitlab icon"
                width={30}
                height={30}
            />
        </button>
    );
}