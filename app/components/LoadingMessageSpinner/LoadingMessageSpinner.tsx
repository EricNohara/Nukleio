"use client";

import { useEffect, useState } from "react";

import styles from "./LoadingMessageSpinner.module.css";
import { PrimaryLoadingSpinner } from "../AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

interface Props {
    messages: string[]; // list of messages to cycle through
    interval?: number;  // base interval in ms
}

export default function LoadingMessageSpinner({
    messages,
    interval = 2000
}: Props) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!messages || messages.length === 0) return;

        // If we reached the final message, stop cycling
        if (index === messages.length - 1) return;

        // Create random delay (0–3000ms)
        const jitter = Math.floor(Math.random() * 3000);
        const delay = interval + jitter;

        const timeout = setTimeout(() => {
            setIndex((prev) => Math.min(prev + 1, messages.length - 1));
        }, delay);

        return () => clearTimeout(timeout);
    }, [index, messages, interval]);

    return (
        <div className={styles.wrapper}>
            <PrimaryLoadingSpinner />
            <p className={styles.message} key={messages[index]}>{messages[index]}</p>
        </div>
    );
}
