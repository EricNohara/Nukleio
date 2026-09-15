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

import styles from "../login/LoginPage.module.css";

interface IInputData {
  email: string;
  password: string;
}

export default function SignUpForm() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<IInputData>({
    email: "",
    password: "",
  });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  const minPasswordLen: number = parseInt(process.env.MIN_PASSWORD_LEN || "6");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      if (userData.password.length < minPasswordLen) {
        throw new Error("Password must be at least 6 characters long");
      }

      if (!captchaToken) {
        throw new Error("Complete the CAPTCHA challenge before signing up.");
      }

      const res = await fetch("/api/internal/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          captchaToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message);
      router.push(
        `/user/signup/confirmEmail?email=${encodeURIComponent(userData.email)}&sent=1`,
      );
    } catch (error) {
      const err = error as Error
      toast.error("Error", err.message)
    } finally {
      setIsLoading(false);
      setCaptchaResetSignal((signal) => signal + 1);
    }
  };

  const handleLogin = () => {
    router.push("/user/login");
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <TextInput
          label="Email"
          name="email"
          value={userData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />
        <TextInput
          label="Password"
          name="password"
          value={userData.password}
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
          <LoadableButtonContent isLoading={isLoading} buttonLabel="Sign up" />
        </ButtonOne>
      </form>

      {/* Form Footer */}
      <div className={styles.formFooterContainer}>
        <div className={styles.dividerContainer}>
          <div className={styles.divider} />
          <p className={`${styles.inputLabel} ${headerFont.className}`}>more</p>
          <div className={styles.divider} />
        </div>

        <div className={styles.oauthButtonsContainer}>
          <ContinueWithGithubButton />
          <ContinueWithGitlabButton />
          <ContinueWithLinkedinButton />
          <ContinueWithGoogleButton />
          <ContinueWithAzureButton />
        </div>

        <div className={styles.otherContent}>
          <p>Already have an account?</p>
          <ButtonThree onClick={handleLogin} className={styles.loginButton}>Sign in</ButtonThree>
        </div>
      </div>
    </>
  );
}
