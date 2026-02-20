"use client";

import { ChevronDown } from "lucide-react";
import { UserCog, SlidersHorizontal, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { useAuth } from "@/app/context/AuthProvider";
import { useToast } from "@/app/context/ToastProvider";
import { useUser } from "@/app/context/UserProvider";
import { headerFont } from "@/app/localFonts";


import styles from "./UserDropdown.module.css";
import { IButtonProp } from "../../ButtonListPopup/ButtonListPopup";
import ButtonListPopup from "../../ButtonListPopup/ButtonListPopup";

export default function UserDropdown() {
    const { state } = useUser();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { setIsLoggedIn } = useAuth();
    const router = useRouter();
    const toast = useToast();

    // Close the popup if clicked outside
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
        setIsOpen(!isOpen);
    };

    const handleSignOut = async () => {
        try {
            const res = await fetch("/api/internal/auth/signout", { method: "POST" });
            if (!res.ok) throw new Error()

            setIsLoggedIn(false);
            router.push("/");
        } catch {
            toast.error("An error occurred while signing out")
        }
    };

    const buttons: IButtonProp[] = [
        { name: "User Settings", icon: UserCog, route: "/user/settings/user" },
        { name: "App Settings", icon: SlidersHorizontal, route: "/user/settings/app" },
        { name: "Log Out", icon: LogOut, action: handleSignOut },
    ];

    return (
        <div className={styles.relativeContainer} ref={containerRef}>
            <button className={`${styles.container} ${isOpen ? styles.openContainer : ""}`} onClick={handleClick}>
                <Image
                    src={state?.portrait_url ? state?.portrait_url : "/images/default-avatar.svg"}
                    height={35}
                    width={35}
                    alt="User profile picture"
                    className={styles.avatar}
                />
                <p className={`${styles.name} ${headerFont.className}`}>{state?.name ? state?.name : "Default User"}</p>
                <ChevronDown />
            </button>
            {isOpen && (
                <div className={styles.popupContainer}>
                    <ButtonListPopup buttons={buttons} />
                </div>
            )}
        </div>
    );
}