"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import LoadableButtonContent from "@/app/components/AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne, ButtonThree } from "@/app/components/Buttons/Buttons";
import ContinueWithAzureButton from "@/app/components/OauthButtons/ContinueWithAzureButton";
import ContinueWithGithubButton from "@/app/components/OauthButtons/ContinueWithGithubButton";
import ContinueWithGoogleButton from "@/app/components/OauthButtons/ContinueWithGoogleButton";
import ContinueWithLinkedinButton from "@/app/components/OauthButtons/ContinueWithLinkedinButton";
import TextInput from "@/app/components/TextInput/TextInput";
import { headerFont } from "@/app/localFonts";

import styles from "../login/LoginPage.module.css";

interface IInputData {
  email: string;
  password: string;
}

export default function SignUpForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<IInputData>({
    email: "",
    password: "",
  });

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

      const res = await fetch("/api/internal/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("Successfully Created User!");
      router.push("/user");
    } catch (error) {
      alert(error);
    }
  };

  const handleLogin = () => {
    router.push("/user/login")
  }

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

        <ButtonOne type="submit" className={styles.loginButton} disabled={isLoading}>
          <LoadableButtonContent isLoading={isLoading} buttonLabel="Sign up" />
        </ButtonOne>
      </form>

      {/* Form Footer */}
      <div className={styles.formFooterContainer}>
        <div className={styles.dividerContainer}>
          <div className={styles.divider} />
          <p className={`${styles.inputLabel} ${headerFont.className}`}>Other</p>
          <div className={styles.divider} />
        </div>

        <div className={styles.oauthButtonsContainer}>
          <ContinueWithGithubButton />
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
