"use client";

import { usePathname } from "next/navigation";

import AppNav from "./AppNav/AppNav";
import LandingNav from "./LandingNav/LandingNav";
import LoginNav from "./LoginNav/LoginNav";


export default function Navigation() {
    const pathname = usePathname();
    const isLanding = pathname === "/";
    const isLoginOrSignUp = pathname === "/user/login" || pathname === "/user/signup";

    if (isLanding) return <LandingNav />;
    else if (isLoginOrSignUp) return <LoginNav />;
    else return <AppNav />;
}
