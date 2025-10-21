"use client";

import { House, File, Briefcase, GraduationCap, Rocket, Brain, Cable, Settings, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { useAuth } from "@/app/context/AuthProvider";
import { headerFont } from "@/app/localFonts";

import styles from "./AppNav.module.css";
import TitleLogo from "../../TitleLogo/TitleLogo";

import type { LucideIcon } from "lucide-react";

interface INavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    regExpPath?: RegExp;
}

const navItems: INavItem[] = [
    { label: "Home", path: "/user", icon: House, },
    { label: "Documents", path: "/user/documents", icon: File },
    { label: "Experience", path: "/user/experience", icon: Briefcase },
    { label: "Education", path: "/user/education", icon: GraduationCap, regExpPath: /^\/user\/education\/\d+\/course$/ },
    { label: "Projects", path: "/user/projects", icon: Rocket },
    { label: "Skills", path: "/user/skills", icon: Brain },
    { label: "Connect", path: "/user/connect", icon: Cable },
];

export default function AppNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { setIsLoggedIn } = useAuth();

    const handleClick = (item: INavItem) => {
        router.push(item.path);
    }

    const handleSignOut = async () => {
        try {
            const res = await fetch("/api/internal/auth/signout", { method: "POST" });

            if (res.ok) {
                setIsLoggedIn(false);
                router.push("/");
            } else {
                alert("Failed to sign out");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <nav className={styles.navContainer}>
            <div className={styles.navSection}>
                <TitleLogo />
                {navItems.map((item, i) => {
                    const Icon = item.icon;
                    const isActive = item.regExpPath ? pathname === item.path || item.regExpPath.test(pathname) : pathname === item.path;
                    return (
                        <button
                            key={i}
                            onClick={() => handleClick(item)}
                            className={`${styles.navButton} ${isActive ? styles.activeNavButton : ""} ${headerFont.className}`}
                        >
                            <Icon />
                            {item.label}
                        </button>
                    );
                }
                )}
            </div>
            <div className={styles.navSection}>
                <button onClick={() => router.push("/user/settings")} className={`${styles.navButton} ${headerFont.className}`}>
                    <Settings />
                    Settings
                </button>
                <button onClick={handleSignOut} className={`${styles.navButton} ${headerFont.className}`}>
                    <LogOut />
                    Sign Out
                </button>
            </div>
        </nav >
    );
}