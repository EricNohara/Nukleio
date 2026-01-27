import Image from "next/image";

import { createClient } from "@/utils/supabase/client";

import styles from "./OauthButtons.module.css";

export default function ContinueWithAzureButton() {
    const supabase = createClient();

    const handleAzure = async () => {
        const base = process.env.NEXT_PUBLIC_SITE_URL;
        const redirectTo = `${base}/api/internal/auth/callback?provider=azure&next=${encodeURIComponent("/user")}`;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "azure",
            options: { redirectTo, scopes: "email" },
        });

        if (error) alert(error.message);
    };

    return (
        <button onClick={handleAzure} className={`${styles.button}`}>
            <Image
                src="/images/microsoft-icon.svg"
                alt="Azure icon"
                width={30}
                height={30}
            />
        </button>
    );
}