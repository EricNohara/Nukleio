"use client";

import { BookText, CircleQuestionMark, Crown, Power, Settings, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { useAuth } from "@/app/context/AuthProvider";
import { useToast } from "@/app/context/ToastProvider";
import { useUser } from "@/app/context/UserProvider";
import { headerFont } from "@/app/localFonts";

import styles from "./UserDropdown.module.css";
import AnimatedChevronIcon from "../../AnimatedIcons/AnimatedChevronIcon";
import { IButtonProp } from "../../ButtonListPopup/ButtonListPopup";
import ButtonListPopup from "../../ButtonListPopup/ButtonListPopup";

export default function UserDropdown() {
    const { state } = useUser();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { setIsLoggedIn } = useAuth();
    const router = useRouter();
    const toast = useToast();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleClick = () => {
        setIsOpen((prev) => !prev);
    };

    const handleSignOut = async () => {
        try {
            const res = await fetch("/api/internal/auth/signout", { method: "POST" });
            if (!res.ok) throw new Error();

            setIsLoggedIn(false);
            router.push("/");
        } catch {
            toast.error("An error occurred while signing out");
        }
    };

    const buttons: IButtonProp[] = [
        { name: "Account", icon: User, route: "/user/settings/user" },
        { name: "Settings", icon: Settings, route: "/user/settings/app" },
        { name: "Documentation", icon: BookText, route: "/documentation/doc" },
        { name: "Help", icon: CircleQuestionMark, route: "/documentation/contact" },
        { name: "Upgrade Account", icon: Crown, route: "/user/settings/billing" },
        { name: "Log Out", icon: Power, action: handleSignOut },
    ];

    return (
        <div className={styles.relativeContainer} ref={containerRef}>
            <button
                type="button"
                className={`${styles.container} ${isOpen ? styles.openContainer : ""}`}
                onClick={handleClick}
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                <div className={styles.left}>
                    <Image
                        src={state?.portrait_url ? state.portrait_url : "/images/default-avatar.svg"}
                        height={45}
                        width={45}
                        alt="User profile picture"
                        className={styles.avatar}
                    />
                    <p className={`${styles.name} ${headerFont.className}`}>
                        {state?.name ? state.name : "Default User"}
                    </p>
                </div>

                <AnimatedChevronIcon open={isOpen} className={styles.chevron} size={24} />
            </button>

            <div
                className={styles.popupContainer}
                data-open={isOpen ? "true" : "false"}
                aria-hidden={!isOpen}
            >
                <ButtonListPopup buttons={buttons} />
            </div>
        </div>
    );
}