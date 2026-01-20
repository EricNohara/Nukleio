import Image from "next/image";

import { createClient } from "@/utils/supabase/client";

import styles from "./OauthButtons.module.css";

export default function ContinueWithGithubButton() {
    const supabase = createClient();

    const handleGithub = async () => {
        const base = process.env.NEXT_PUBLIC_SITE_URL;
        const redirectTo = `${base}/api/internal/auth/callback?provider=github&next=${encodeURIComponent("/user")}`;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: { redirectTo },
        });

        if (error) alert(error.message);
    };

    return (
        <button onClick={handleGithub} className={`${styles.button} ${styles.github}`}>
            <span className={styles.iconWrapper}>
                <Image
                    src="/images/github-icon.svg"
                    alt="GitHub icon"
                    width={25}
                    height={25}
                />
            </span>

            <span className={styles.buttonText}>GitHub</span>
        </button>
    );
}