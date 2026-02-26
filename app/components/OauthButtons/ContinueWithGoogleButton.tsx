import Image from "next/image";

import { useToast } from "@/app/context/ToastProvider";
import { createClient } from "@/utils/supabase/client";

import styles from "./OauthButtons.module.css";

export default function ContinueWithGoogleButton() {
    const supabase = createClient();
    const toast = useToast();

    const handleGoogle = async () => {
        const base = process.env.NEXT_PUBLIC_SITE_URL;
        const redirectTo = `${base}/api/internal/auth/callback?provider=google&next=${encodeURIComponent("/user")}`;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo },
        });

        if (error) toast.error("Error logging in with Google")
    };

    return (
        <button onClick={handleGoogle} className={`${styles.button}`}>
            <Image
                src="/images/google-icon.svg"
                alt="Google icon"
                width={30}
                height={30}
            />
        </button>
    );
}