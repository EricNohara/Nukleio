"use client";

import { Clock3, Mail, RotateCw, SendHorizonal } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne } from "@/app/components/Buttons/Buttons";
import TurnstileWidget from "@/app/components/Turnstile/TurnstileWidget";
import { useToast } from "@/app/context/ToastProvider";
import { useUser } from "@/app/context/UserProvider";
import { headerFont } from "@/app/localFonts";
import { createClient } from "@/utils/supabase/client";

import styles from "./ResetPasswordForm.module.css";

const COOLDOWN_SECONDS = 60;

export default function ResetPasswordForm() {
    const supabase = useMemo(() => createClient(), []);
    const { state } = useUser();

    const [isLoading, setIsLoading] = useState(false);

    const [cooldown, setCooldown] = useState<number>(0);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
    const [email, setEmail] = useState(state?.email ?? "");

    const toast = useToast();

    // The user-info request can run before Supabase restores the browser session.
    // Read the authenticated user directly so the first visit is not left disabled.
    useEffect(() => {
        if (state?.email) setEmail(state.email);
    }, [state?.email]);

    useEffect(() => {
        const syncEmail = async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user?.email) setEmail(data.user.email);
        };

        void syncEmail();

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            setEmail(session?.user.email ?? "");
        });

        return () => subscription.subscription.unsubscribe();
    }, [supabase]);

    // countdown timer
    useEffect(() => {
        if (cooldown <= 0) return;

        const id = setInterval(() => {
            setCooldown((c) => Math.max(0, c - 1));
        }, 1000);

        return () => clearInterval(id);
    }, [cooldown]);

    const onPasswordReset = async () => {
        toast.clear();

        if (!email || !captchaToken) {
            toast.error(
                "Error",
                !email
                    ? "You need to be signed in to send a reset link."
                    : "Complete the CAPTCHA challenge before requesting a reset link.",
            );
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/passwordReset?next=/user/settings/password`,
                captchaToken,
            });

            if (error) throw error;

            toast.success(
                "Success",
                "Successfully sent email. If an account exists for this email, a reset link has been sent."
            );
            setCooldown(COOLDOWN_SECONDS);
        } catch {
            toast.error(
                "Error",
                "Error sending email. Couldn't send the reset email. Please try again."
            );
        } finally {
            setIsLoading(false);
            setCaptchaResetSignal((signal) => signal + 1);
        }
    };

    const buttonDisabled = isLoading || cooldown > 0 || !email || !captchaToken;

    return (
        <div className={styles.inputForm}>
            <div className={styles.formHeader}>
                <div className={styles.headerText}>
                    <h1 className={`${headerFont.className} ${styles.formTitle}`}>
                        Password reset
                    </h1>
                    <h3 className={`${styles.formSubtitle} ${headerFont.className}`}>
                        We&apos;ll email you a secure link to choose a new password
                    </h3>
                </div>

                <div className={styles.buttons}>
                    <TurnstileWidget
                        onTokenChange={setCaptchaToken}
                        resetSignal={captchaResetSignal}
                    />
                    <ButtonOne onClick={onPasswordReset} disabled={buttonDisabled}>
                        {cooldown > 0 ? (
                            `Resend in ${cooldown}s`
                        ) : (
                            <LoadableButtonContent
                                isLoading={isLoading}
                                buttonLabel="Send reset link"
                            />
                        )}
                    </ButtonOne>
                </div>
            </div>

            <div className={styles.instructions}>
                <h2>How it works</h2>
                <p className={`${styles.instructionsSubtitle} ${headerFont.className}`}>Follow these steps to reset your password.</p>

                <ol className={styles.steps}>
                    <li className={styles.step}>
                        <span className={styles.stepNumber}>1</span>
                        <span className={styles.stepIcon}><SendHorizonal size={25} /></span>
                        <span><strong>We&apos;ll send you an email</strong><small>A secure password reset link will be sent to the email below.</small></span>
                    </li>
                    <li className={styles.step}>
                        <span className={styles.stepNumber}>2</span>
                        <span className={styles.stepIcon}><Mail size={25} /></span>
                        <span><strong>Check your email</strong><small>Click the link in the email.</small></span>
                    </li>
                    <li className={styles.step}>
                        <span className={styles.stepNumber}>3</span>
                        <span className={styles.stepIcon}><Clock3 size={25} /></span>
                        <span><strong>The link expires soon</strong><small>For security, the link will expire shortly.</small></span>
                    </li>
                    <li className={styles.step}>
                        <span className={styles.stepNumber}>4</span>
                        <span className={styles.stepIcon}><RotateCw size={25} /></span>
                        <span><strong>Set a new password</strong><small>Follow the link to create a new password.</small></span>
                    </li>
                </ol>

                <div className={styles.emailCard}>
                    <span className={styles.emailIcon}><Mail size={27} /></span>
                    <div>
                        <small>Reset link will be sent to</small>
                        <strong>{email || "Your account email"}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
