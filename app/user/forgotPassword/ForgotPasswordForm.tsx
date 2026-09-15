"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne, ButtonThree } from "@/app/components/Buttons/Buttons";
import TextInput from "@/app/components/TextInput/TextInput";
import TurnstileWidget from "@/app/components/Turnstile/TurnstileWidget";
import { useToast } from "@/app/context/ToastProvider";
import { headerFont } from "@/app/localFonts";
import { createClient } from "@/utils/supabase/client";

import styles from "./ForgotPasswordPage.module.css";

export default function ForgotPasswordForm() {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (email.length === 0 || !captchaToken) return;

        setIsLoading(true);

        try {
            // send the recovery email
            const { error } = await supabase.auth
                .resetPasswordForEmail(email, {
                    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/passwordReset?next=/user`,
                    captchaToken,
                });
            if (error) throw new Error(error.message);
            toast.info("Password reset email sent. Check your inbox.")
        } catch {
            toast.error("Failed to send password reset email")
        } finally {
            setIsLoading(false);
            setCaptchaResetSignal((signal) => signal + 1);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className={styles.loginForm}>
                <TextInput
                    label="Email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                />
                <TurnstileWidget
                    onTokenChange={setCaptchaToken}
                    resetSignal={captchaResetSignal}
                    messageClassName={styles.inputLabel}
                />
                <ButtonOne type="submit" className={styles.loginButton} disabled={isLoading || !captchaToken}>
                    <LoadableButtonContent isLoading={isLoading} buttonLabel="Send reset link" />
                </ButtonOne>
            </form >

            {/* Form Footer */}
            <div className={styles.formFooterContainer}>
                <div className={styles.dividerContainer}>
                    <div className={styles.divider} />
                    <p className={`${styles.inputLabel} ${headerFont.className}`}>Other</p>
                    <div className={styles.divider} />
                </div>
                <div className={styles.otherContent}>
                    <p>Remembered your password?</p>
                    <ButtonThree onClick={() => router.push("/user/login")} className={styles.loginButton}>Sign in</ButtonThree>
                </div>
            </div>
        </>
    );
}
