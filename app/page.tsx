"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ButtonOne, ButtonTwo } from "./components/Buttons/Buttons";
import Navigation from "./components/Navigation/Navigation";
import { useAuth } from "./context/AuthProvider";
import styles from "./LandingPage.module.css";

export default function LandingPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/user");
    }
  }, [isLoggedIn, router]);

  const handleSignUp = () => {
    router.push("/user/signup")
  }

  return (
    <>
      <Navigation />

      <div className={styles.backgroundImage}>
        <Image
          src="/images/home-logo.png"
          fill
          alt="Nukleio home page logo"
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      <div className={styles.content}>
        <h1 className={styles.hero}>
          Portfolio management <span>simplified</span>
        </h1>
        <div className={styles.subtextContainer}>
          <h2 className={styles.subtext}>
            Update fast, sync across connected sites instantly.
          </h2>
          <h2 className={styles.subtext}>
            Free, fast, and secure API for developers.
          </h2>
        </div>
        <div className={styles.ctaButtonsContainer}>
          <ButtonOne onClick={handleSignUp}>Get Started Free</ButtonOne>
          <ButtonTwo>Read Docs</ButtonTwo>
        </div>
      </div>
    </>
  );
}
