import Image from "next/image";

import { createClient } from "@/utils/supabase/client";

import styles from "./OauthButtons.module.css";

export default function ContinueWithGoogleButton() {
    const supabase = createClient();

    const handleLinkedin = async () => {
        const base = process.env.NEXT_PUBLIC_SITE_URL;
        const redirectTo = `${base}/api/internal/auth/callback?provider=google&next=${encodeURIComponent("/user")}`;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo },
        });

        if (error) alert(error.message);
    };

    return (
        <button onClick={handleLinkedin} className={`${styles.button} ${styles.google}`}>
            <span className={styles.iconWrapper}>
                <Image
                    src="/images/google-icon.svg"
                    alt="Google icon"
                    width={25}
                    height={25}
                />
            </span>

            <span className={styles.buttonText}>Google</span>
        </button>
    );
}