"use client";

import React from "react";

import styles from "./AnimatedIcons.module.css";

type Props = {
    open?: boolean;
    className?: string;
    iconClassName?: string;
    size?: number;
};

export default function AnimatedChevronIcon({
    open = false,
    className = "",
    iconClassName = "",
    size = 18,
}: Props) {
    return (
        <span
            className={`${styles.root} ${className}`}
            aria-hidden="true"
            data-open={open ? "true" : "false"}
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 20 20"
                className={`${styles.icon} ${iconClassName}`}
            >
                <path
                    d="M5.5 7.5L10 12l4.5-4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
}