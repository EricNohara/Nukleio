"use client";

import React, { Suspense } from "react";

import AuthBackground from "@/app/components/AuthBackground/AuthBackground";
import Navigation from "@/app/components/Navigation/Navigation";
import TitleLogo from "@/app/components/TitleLogo/TitleLogo";
import { headerFont, titleFont } from "@/app/localFonts";

import ConfirmEmailForm from "./ConfirmEmailForm";
import styles from "../../login/LoginPage.module.css";

export default function ConfirmEmailPage() {
  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <h1 className={`${styles.formTitle} ${titleFont.className}`}>
          Confirm your email address
        </h1>
        <h3 className={`${styles.formSubtitle} ${headerFont.className}`}>
          Activate your Nukleio account to continue
        </h3>
        <Suspense fallback={null}>
          <ConfirmEmailForm />
        </Suspense>
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
