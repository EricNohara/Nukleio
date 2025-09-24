"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/app/context/AuthProvider";

import AppNav from "./AppNav/AppNav";
import LandingNav from "./LandingNav/LandingNav";
import LoginNav from "./LoginNav/LoginNav";


export default function Navigation() {
    const pathname = usePathname();
    const { isLoggedIn, setIsLoggedIn } = useAuth();

    // Fetch user when component mounts
    useEffect(() => {
        const fetchUser = async () => {
            const res = await fetch("/api/internal/auth/authenticated", { method: "GET" });
            if (!res.ok) setIsLoggedIn(false);
            else setIsLoggedIn(true);
        };
        fetchUser();
    }, [setIsLoggedIn]);

    const isLanding = pathname === "/";
    const isLoginOrSignUp = pathname === "/user/login" || pathname === "/user/signup";

    if (isLanding) return <LandingNav />;
    else if (isLoginOrSignUp) return <LoginNav />;
    else if (isLoggedIn) return <AppNav />;
    else return null;
}
