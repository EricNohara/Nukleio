"use client";

import { usePathname } from "next/navigation";

import styles from "./BodyWrapper.module.css";

export default function BodyWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLanding = pathname === "/";

    return (
        <div className={isLanding ? styles.landing : styles.app}>
            {children}
        </div>
    );
}
