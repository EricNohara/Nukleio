"use client";

import { usePathname } from "next/navigation";

import AppNav from "./AppNav/AppNav";
import LandingNav from "./LandingNav/LandingNav";
import LoginNav from "./LoginNav/LoginNav";


export default function Navigation() {
    const pathname = usePathname();
    const isLoginOrSignUp = pathname === "/user/login"
        || pathname === "/user/signup"
        || pathname === "/user/forgotPassword"
        || pathname === "/user/signup/confirmEmail"
        || pathname === "/passwordReset";

    if (pathname === "/") return <LandingNav />;
    else if (isLoginOrSignUp) return <LoginNav />;
    else return <AppNav />;
}
