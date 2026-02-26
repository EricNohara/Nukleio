"use client";

import { useEffect } from "react";

import { applyTheme, getStoredTheme } from "@/utils/general/theme";

export default function ThemeInit() {
    useEffect(() => {
        const stored = getStoredTheme();
        if (stored) applyTheme(stored);
    }, []);

    return null;
}