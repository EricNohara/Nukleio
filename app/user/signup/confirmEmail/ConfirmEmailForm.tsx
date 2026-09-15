"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne, ButtonThree } from "@/app/components/Buttons/Buttons";
import TextInput from "@/app/components/TextInput/TextInput";
import TurnstileWidget from "@/app/components/Turnstile/TurnstileWidget";
import { useToast } from "@/app/context/ToastProvider";

import styles from "../../login/LoginPage.module.css";

const RESEND_COOLDOWN_SECONDS = 60;

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 1)}${"•".repeat(Math.max(1, local.length - 1))}@${domain}`;
}

export default function ConfirmEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    searchParams.get("sent") === "1" ? RESEND_COOLDOWN_SECONDS : 0,
  );
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [secondsRemaining]);

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !captchaToken || secondsRemaining > 0) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/internal/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success(data.message);
      setSecondsRemaining(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to resend the confirmation email.";
      toast.error("Error", message);
    } finally {
      setIsLoading(false);
      setCaptchaResetSignal((signal) => signal + 1);
    }
  };

  return (
    <>
      <form onSubmit={handleResend} className={styles.loginForm}>
        <p className={styles.inputLabel}>
          {email
            ? `We sent a confirmation link to ${maskEmail(email)}.`
            : "Enter your email address to receive a confirmation link."}
          {" "}Open the newest link once to activate your account.
        </p>
        <TextInput
          label="Email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          required
          type="email"
        />
        <TurnstileWidget
          onTokenChange={setCaptchaToken}
          resetSignal={captchaResetSignal}
          messageClassName={styles.inputLabel}
        />
        <ButtonOne
          type="submit"
          className={styles.loginButton}
          disabled={isLoading || secondsRemaining > 0 || !email.trim() || !captchaToken}
        >
          <LoadableButtonContent
            isLoading={isLoading}
            buttonLabel={
              secondsRemaining > 0
                ? `Resend available in ${secondsRemaining}s`
                : "Resend confirmation email"
            }
          />
        </ButtonOne>
      </form>

      <div className={styles.formFooterContainer}>
        <div className={styles.otherContent}>
          <p>Already confirmed your email?</p>
          <ButtonThree
            onClick={() => router.push("/user/login")}
            className={styles.loginButton}
          >
            Sign in
          </ButtonThree>
          <ButtonThree
            onClick={() => router.push("/user/signup")}
            className={styles.loginButton}
          >
            Use a different email
          </ButtonThree>
        </div>
      </div>
    </>
  );
}
