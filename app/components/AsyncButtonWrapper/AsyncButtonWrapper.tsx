"use client";

import { useState, ReactElement, cloneElement, useRef } from "react";

import styles from "./AsyncButtonWrapper.module.css";

interface AsyncButtonWrapperProps {
    button: ReactElement;
    onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
    isDisabled?: boolean;
}

// button wrapper making a button clickable once
export function AsyncButtonWrapper({ button, onClick, isDisabled }: AsyncButtonWrapperProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isLoadingRef = useRef(false); // tracks loading immediately

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled || isLoadingRef.current) return; // block instantly

        isLoadingRef.current = true;
        setIsLoading(true);

        if (onClick) {
            try {
                await onClick(e);
            } finally {
                isLoadingRef.current = false;
                setIsLoading(false);
            }
        }
    };

    // clone the given button element and inject our props
    const wrappedButton = cloneElement(button, {
        onClick: handleClick,
        disabled: button.props.disabled || isLoading,
        children: (
            <div className={styles.buttonContent}>
                <span className={`${styles.contentWrapper} ${isLoading ? styles.invisible : ""}`}>{button.props.children}</span>
                {isLoading && <span className={styles.spinner} />}
            </div>
        ),
    });

    return wrappedButton;
}
