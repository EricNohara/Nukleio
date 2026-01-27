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
import { headerFont } from "@/app/localFonts";

import styles from "./LoginPage.module.css";

export default function LoginForm() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

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
      const res = await fetch("/api/internal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      router.push("/user");
    } catch (err) {
      alert(err);
      setCredentials({ email: "", password: "" });
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("/user/signup")
  }

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
        <ButtonOne type="submit" className={styles.loginButton} disabled={isLoading}>
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
          <ContinueWithGithubButton />
          <ContinueWithGitlabButton />
          <ContinueWithLinkedinButton />
          <ContinueWithGoogleButton />
          <ContinueWithAzureButton />
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
