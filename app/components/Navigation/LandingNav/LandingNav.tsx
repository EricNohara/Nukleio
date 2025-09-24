"use client";

import { useRouter } from "next/navigation";

import styles from "./LandingNav.module.css";
import { ButtonOne, ButtonTwo } from "../../Buttons/Buttons";
import TitleLogo from "../../TitleLogo/TitleLogo";

export default function LandingNav() {
    const router = useRouter();

    const handleSignIn = () => {
        router.push("/user/login")
    }

    const handleSignUp = () => {
        router.push("/user/signup")
    }

    return (
        <nav className={styles.horizontalNav} >
            <TitleLogo />
            <ul className={styles.landingLinks}>
                <li><a href="">Product</a></li>
                <li><a href="">Docs</a></li>
                <li><a href="">Pricing</a></li>
                <li><a href="">Contact</a></li>
            </ul>
            <div className={styles.buttonsContainer}>
                <ButtonTwo onClick={handleSignIn}>Sign in</ButtonTwo>
                <ButtonOne onClick={handleSignUp}>Sign up</ButtonOne>
            </div>
        </nav>
    );
}