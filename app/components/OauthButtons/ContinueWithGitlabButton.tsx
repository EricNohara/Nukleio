import Image from "next/image";

import { createClient } from "@/utils/supabase/client";

import styles from "./OauthButtons.module.css";

export default function ContinueWithGitlabButton() {
    const supabase = createClient();

    const handleGitlab = async () => {
        const base = process.env.NEXT_PUBLIC_SITE_URL;
        const redirectTo = `${base}/api/internal/auth/callback?provider=gitlab&next=${encodeURIComponent("/user")}`;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "gitlab",
            options: { redirectTo },
        });

        if (error) alert(error.message);
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