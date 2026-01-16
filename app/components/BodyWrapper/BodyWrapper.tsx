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

    return (
        <div className={isLandingOrDoc ? styles.landing : styles.app}>
            {children}
        </div>
    );
}
