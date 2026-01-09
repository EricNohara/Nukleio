"use client";

import Image from "next/image";
import React from "react";

import Navigation from "@/app/components/Navigation/Navigation";
import TitleLogo from "@/app/components/TitleLogo/TitleLogo";
import { titleFont, headerFont } from "@/app/localFonts";

import ForgotPasswordForm from "./ForgotPasswordForm";
import styles from "./ForgotPasswordPage.module.css";

export default function ForgotPasswordPage() {
    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <h1 className={`${styles.formTitle} ${titleFont.className}`}>Forgot your password?</h1>
                <h3 className={`${styles.formSubtitle} ${headerFont.className}`}>Enter your email and we'll send you a reset link</h3>
                <ForgotPasswordForm />
            </div>

            {/* Right side (background image with nav) */}
            <div className={styles.rightPanel}>
                <Image
                    src="/images/login-signup-graphic.svg"
                    alt="Login Signup Graphic"
                    fill
                    priority
                    className={styles.backgroundImage}
                />
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