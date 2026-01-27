import Image from "next/image";

import { createClient } from "@/utils/supabase/client";

import styles from "./OauthButtons.module.css";

export default function ContinueWithLinkedinButton() {
    const supabase = createClient();

    const handleLinkedin = async () => {
        const base = process.env.NEXT_PUBLIC_SITE_URL;
        const redirectTo = `${base}/api/internal/auth/callback?provider=linkedin_oidc&next=${encodeURIComponent("/user")}`;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "linkedin_oidc",
            options: { redirectTo },
        });

        if (error) alert(error.message);
    };

    return (
        <button onClick={handleLinkedin} className={`${styles.button}`}>
            <Image
                src="/images/linkedin-icon.svg"
                alt="LinkedIn icon"
                width={30}
                height={30}
            />
        </button>
    );
}