"use client";

import { ChevronDown } from "lucide-react";
import { UserCog, SlidersHorizontal, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { headerFont } from "@/app/localFonts";

import { useAuth } from "@/app/context/AuthProvider";

import styles from "./UserDropdown.module.css";
import { IButtonProp } from "../../ButtonListPopup/ButtonListPopup";
import ButtonListPopup from "../../ButtonListPopup/ButtonListPopup";


interface IUserDropdownInfo {
    portrait_url: string | null;
    name: string | null;
}

export default function UserDropdown() {
    const [userDropdownInfo, setUserDropdownInfo] = useState<IUserDropdownInfo>({ portrait_url: null, name: null });
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { setIsLoggedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetcher = async () => {
            try {
                const res = await fetch("/api/internal/user", { method: "GET" });
                const data = await res.json();
                if (!res.ok) throw new Error("Failed to retrieve experience data");
                setUserDropdownInfo(data.userData);
            } catch (err) {
                alert(err);
            }
        };

        fetcher();
    }, []);

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

    const buttons: IButtonProp[] = [
        { name: "User Settings", icon: UserCog, route: "/user/settings/user" },
        { name: "App Settings", icon: SlidersHorizontal, route: "/user/settings/app" },
        { name: "Log Out", icon: LogOut, action: handleSignOut },
    ];

    return (
        <div className={styles.relativeContainer} ref={containerRef}>
            <button className={`${styles.container} ${isOpen ? styles.openContainer : ""}`} onClick={handleClick}>
                <Image
                    src={userDropdownInfo.portrait_url ? userDropdownInfo.portrait_url : "/images/default-avatar.svg"}
                    height={35}
                    width={35}
                    alt="User profile picture"
                    className={styles.avatar}
                />
                <p className={`${styles.name} ${headerFont.className}`}>{userDropdownInfo.name ? userDropdownInfo.name : "Default User"}</p>
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