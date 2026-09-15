"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import AuthBackground from "@/app/components/AuthBackground/AuthBackground";
import { ButtonOne } from "@/app/components/Buttons/Buttons";
import Navigation from "@/app/components/Navigation/Navigation";
import TextInput from "@/app/components/TextInput/TextInput";
import TitleLogo from "@/app/components/TitleLogo/TitleLogo";
import { useToast } from "@/app/context/ToastProvider";
import { headerFont, titleFont } from "@/app/localFonts";
import styles from "@/app/user/forgotPassword/ForgotPasswordPage.module.css";
import { createClient } from "@/utils/supabase/client";


const MIN_PASSWORD_LENGTH = 6;
const SETTINGS_PASSWORD_PATH = "/user/settings/password";

function getReturnPath() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next === SETTINGS_PASSWORD_PATH ? next : "/user";
}

export default function PasswordResetPage() {
    const router = useRouter();
    const toast = useToast();
    const supabase = useMemo(() => createClient(), []);
    const [isReady, setIsReady] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [returnPath, setReturnPath] = useState("/user");

    useEffect(() => {
        setReturnPath(getReturnPath());

        const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
                setIsReady(true);
            }
        });

        void supabase.auth.getSession().then(({ data }) => {
            if (data.session) setIsReady(true);
        });

        return () => subscription.subscription.unsubscribe();
    }, [supabase]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password.length < MIN_PASSWORD_LENGTH) {
            toast.error("Password is too short", `Use at least ${MIN_PASSWORD_LENGTH} characters.`);
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match", "Enter the same password in both fields.");
            return;
        }

        setIsLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setIsLoading(false);

        if (error) {
            toast.error("Could not update password", "Your reset link may have expired. Request a new one and try again.");
            return;
        }

        toast.success("Password updated", "Your password has been changed successfully.");
        router.replace(returnPath);
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <h1 className={`${styles.formTitle} ${titleFont.className}`}>Create a new password</h1>
                <h3 className={`${styles.formSubtitle} ${headerFont.className}`}>Choose a new password to secure your account</h3>

                {isReady ? (
                    <form onSubmit={handleSubmit} className={styles.loginForm}>
                        <TextInput
                            label="New password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your new password"
                            required
                        />
                        <TextInput
                            label="Confirm new password"
                            name="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="Confirm your new password"
                            required
                        />
                        <ButtonOne type="submit" className={styles.loginButton} disabled={isLoading}>
                            <LoadableButtonContent isLoading={isLoading} buttonLabel="Update password" />
                        </ButtonOne>
                    </form>
                ) : (
                    <p className={styles.inputLabel}>Preparing your secure password reset…</p>
                )}
            </div>

            <div className={styles.rightPanel}>
                <AuthBackground />
                <div className={styles.navWrapper}>
                    <Navigation />
                </div>
                <div className={styles.titleLogoWrapper}>
                    <TitleLogo />
                </div>
            </div>
        </div>
    );
}
