"use client";

import { usePathname } from "next/navigation";

import styles from "./BodyWrapper.module.css";

export default function BodyWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLandingOrDoc = pathname === "/"
        || pathname === "/documentation/product"
        || pathname === "/documentation/contact"
        || pathname === "/documentation/doc"
        || pathname === "/documentation/pricing";
    const isPolicy = pathname === "/policy/privacy" || pathname === "/policy/tos";

    const wrapperClass = isLandingOrDoc ? styles.landing : isPolicy ? styles.policy : styles.app;

    return (
        <div className={wrapperClass}>
            {children}
        </div>
    );
}
