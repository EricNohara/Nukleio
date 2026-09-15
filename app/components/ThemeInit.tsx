"use client";

import { useEffect } from "react";

import {
    applyBorderRadius,
    applyTheme,
    getStoredBorderRadius,
    getStoredTheme,
} from "@/utils/general/theme";

export default function ThemeInit() {
    useEffect(() => {
        const stored = getStoredTheme();
        if (stored) applyTheme(stored);

        const storedBorderRadius = getStoredBorderRadius();
        if (storedBorderRadius) applyBorderRadius(storedBorderRadius);
    }, []);

    return null;
}
