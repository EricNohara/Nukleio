// import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

import styles from "./OauthButtons.module.css";

export default function ContinueWithLinkedinButton() {
    // const supabase = createClient();

    const handleLinkedin = async () => {
        // const base = process.env.NEXT_PUBLIC_SITE_URL;
        // const redirectTo = `${base}/api/internal/auth/callback?next=${encodeURIComponent("/user")}`;

        // const { error } = await supabase.auth.signInWithOAuth({
        //     provider: "github",
        //     options: { redirectTo },
        // });

        // if (error) alert(error.message);
    };

    return (
        <button onClick={handleLinkedin} className={`${styles.button} ${styles.linkedin}`}>
            <span className={styles.iconWrapper}>
                <Image
                    src="/images/linkedin-icon.svg"
                    alt="LinkedIn icon"
                    width={25}
                    height={25}
                />
            </span>

            <span className={styles.buttonText}>Continue with LinkedIn</span>
        </button>
    );
}