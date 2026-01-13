"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne, ButtonThree } from "@/app/components/Buttons/Buttons";
import TextInput from "@/app/components/TextInput/TextInput";
import { headerFont } from "@/app/localFonts";
import { createClient } from "@/utils/supabase/client";

import styles from "./ForgotPasswordPage.module.css";

export default function ForgotPasswordForm() {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (email.length === 0) return;

        setIsLoading(true);

        try {
            // send the recovery email
            const { error } = await supabase.auth
                .resetPasswordForEmail(email, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/passwordReset` });
            if (error) throw new Error(error.message);
            alert("Password reset email sent. Check your inbox.");
        } catch (error) {
            console.error(error);
            alert(error);
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
                <ButtonOne type="submit" className={styles.loginButton} disabled={isLoading}>
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
