"use client";

import { usePathname } from "next/navigation";

import AppNav from "./AppNav/AppNav";
import LandingNav from "./LandingNav/LandingNav";
import LoginNav from "./LoginNav/LoginNav";


export default function Navigation() {
    const pathname = usePathname();
    const isLandingOrDoc = pathname === "/"
        || pathname === "/documentation/product"
        || pathname === "/documentation/contact"
        || pathname === "/documentation/doc"
        || pathname === "/documentation/pricing";
    const isLoginOrSignUp = pathname === "/user/login" || pathname === "/user/signup" || pathname === "/user/forgotPassword";

    if (isLandingOrDoc) return <LandingNav />;
    else if (isLoginOrSignUp) return <LoginNav />;
    else return <AppNav />;
}
