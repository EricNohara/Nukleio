"use client";

import React, { useEffect, useMemo, useState } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne } from "@/app/components/Buttons/Buttons";
import Snackbar from "@/app/components/Snackbar/Snackbar";
import { useUser } from "@/app/context/UserProvider";
import { headerFont } from "@/app/localFonts";
import { createClient } from "@/utils/supabase/client";

import styles from "./ResetPasswordForm.module.css";

const COOLDOWN_SECONDS = 60;

export default function ResetPasswordForm() {
    const supabase = useMemo(() => createClient(), []);
    const { state } = useUser();

    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        message: string;
        variant: "success" | "error";
    } | null>(null);

    const [cooldown, setCooldown] = useState<number>(0);

    const email = state?.email ?? "";

    // countdown timer
    useEffect(() => {
        if (cooldown <= 0) return;

        const id = setInterval(() => {
            setCooldown((c) => Math.max(0, c - 1));
        }, 1000);

        return () => clearInterval(id);
    }, [cooldown]);

    const onPasswordReset = async () => {
        setSnackbar(null);

        if (!email) {
            setSnackbar({
                message: "You need to be signed in to send a reset link.",
                variant: "error",
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/passwordReset`,
            });

            if (error) throw error;

            setSnackbar({
                message: "If an account exists for this email, a reset link has been sent.",
                variant: "success",
            });
            setCooldown(COOLDOWN_SECONDS);
        } catch (err) {
            console.error(err);
            setSnackbar({
                message: "Couldn't send the reset email. Please try again.",
                variant: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const buttonDisabled = isLoading || cooldown > 0 || !email;

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

            {/* Instructions */}
            <div className={styles.instructions}>
                <h3>How it works</h3>

                <ul className={styles.instructionList}>
                    <li>Click the <strong className={styles.sendResetLink}>Send reset link</strong> button to send the reset email</li>
                    <li>Check your email for a password reset link</li>
                    <li>The link will expire after a short time</li>
                    <li>Check spam or junk folders if you don&apos;t see it</li>
                    <li>Click the link in the email to access the password reset page</li>
                    <li>You can reset your password from the password reset page</li>
                    <li>The reset link will become invalid after your first redirect</li>
                    <li>You can resend the link after the 60 second cooldown</li>
                </ul>

                <h3>Email: <span>{email || ""}</span></h3>
            </div>

            {/* Status message */}
            {snackbar && (
                <Snackbar
                    message={snackbar.message}
                    variant={snackbar.variant}
                    onClose={() => setSnackbar(null)}
                />
            )}
        </div>
    );
}
