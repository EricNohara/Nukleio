"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne, ButtonThree } from "@/app/components/Buttons/Buttons";
import ContinueWithAzureButton from "@/app/components/OauthButtons/ContinueWithAzureButton";
import ContinueWithGithubButton from "@/app/components/OauthButtons/ContinueWithGithubButton";
import ContinueWithGitlabButton from "@/app/components/OauthButtons/ContinueWithGitlabButton";
import ContinueWithGoogleButton from "@/app/components/OauthButtons/ContinueWithGoogleButton";
import ContinueWithLinkedinButton from "@/app/components/OauthButtons/ContinueWithLinkedinButton";
import TextInput from "@/app/components/TextInput/TextInput";
import TurnstileWidget from "@/app/components/Turnstile/TurnstileWidget";
import { useToast } from "@/app/context/ToastProvider";
import { headerFont } from "@/app/localFonts";

import styles from "./LoginPage.module.css";

export default function LoginForm() {
  const router = useRouter();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCredentials((prevCredentials) => ({
      ...prevCredentials,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      if (!captchaToken) {
        throw new Error("Complete the CAPTCHA challenge before signing in.");
      }

      const res = await fetch("/api/internal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...credentials, captchaToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "EMAIL_NOT_CONFIRMED") {
          router.push(
            `/user/signup/confirmEmail?email=${encodeURIComponent(credentials.email)}`,
          );
          return;
        }
        throw new Error(data.message);
      }

      router.push("/user");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message)
      setCredentials({ email: "", password: "" });
    } finally {
      setIsLoading(false);
      setCaptchaResetSignal((signal) => signal + 1);
    }
  };

  const handleSignUp = () => {
    router.push("/user/signup");
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <TextInput
          label="Email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />
        <TextInput
          label="Password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
          type="password"
        />
        <TurnstileWidget
          onTokenChange={setCaptchaToken}
          resetSignal={captchaResetSignal}
          messageClassName={styles.inputLabel}
        />
        <ButtonOne type="submit" className={styles.loginButton} disabled={isLoading || !captchaToken}>
          <LoadableButtonContent isLoading={isLoading} buttonLabel="Sign in" />
        </ButtonOne>
      </form >

      {/* Form Footer */}
      <div className={styles.formFooterContainer}>
        <div className={styles.dividerContainer}>
          <div className={styles.divider} />
          <p className={`${styles.inputLabel} ${headerFont.className}`}>more</p>
          <div className={styles.divider} />
        </div>

        {/* testing OAUTH */}
        <div className={styles.oauthButtonsContainer}>
          <ContinueWithGithubButton captchaToken={captchaToken} onCaptchaConsumed={() => setCaptchaResetSignal((signal) => signal + 1)} />
          <ContinueWithGitlabButton captchaToken={captchaToken} onCaptchaConsumed={() => setCaptchaResetSignal((signal) => signal + 1)} />
          <ContinueWithLinkedinButton captchaToken={captchaToken} onCaptchaConsumed={() => setCaptchaResetSignal((signal) => signal + 1)} />
          <ContinueWithGoogleButton captchaToken={captchaToken} onCaptchaConsumed={() => setCaptchaResetSignal((signal) => signal + 1)} />
          <ContinueWithAzureButton captchaToken={captchaToken} onCaptchaConsumed={() => setCaptchaResetSignal((signal) => signal + 1)} />
        </div>

        <div className={styles.otherContent}>
          <p>Don&apos;t have an account?</p>
          <ButtonThree onClick={handleSignUp} className={styles.loginButton}>Sign up</ButtonThree>
          <a href="/user/forgotPassword" className={headerFont.className}>Forgot password</a>
        </div>
      </div>
    </>
  );
}
