"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import styles from "./SelectDropdown.module.css";
import AnimatedChevronIcon from "../AnimatedIcons/AnimatedChevronIcon";

export type SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type Props = {
    value: string;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    onChange: (value: string) => void;
    closeOnSelect?: boolean;
    className?: string;
    ariaLabel?: string;
};

export default function SelectDropdown({
    value,
    options,
    placeholder = "Select...",
    disabled = false,
    loading = false,
    onChange,
    closeOnSelect = true,
    className,
    ariaLabel,
}: Props) {
    const [open, setOpen] = useState(false);

    const rootRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const listRef = useRef<HTMLUListElement | null>(null);

    const selected = useMemo(
        () => options.find((o) => o.value === value) ?? null,
        [options, value]
    );

    const isDisabled = disabled || loading || options.length === 0;

    // click outside to close
    useEffect(() => {
        const onDocDown = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocDown);
        return () => document.removeEventListener("mousedown", onDocDown);
    }, []);

    // ESC to close
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const displayText =
        loading ? "Loading…" : selected?.label ?? placeholder;

    const handleToggle = () => {
        if (isDisabled) return;
        setOpen((v) => !v);
    };

    const handleSelect = (opt: SelectOption) => {
        if (opt.disabled) return;
        onChange(opt.value);
        if (closeOnSelect) setOpen(false);
        // keep focus on trigger for keyboard users
        buttonRef.current?.focus();
    };

    const onButtonKeyDown = (e: React.KeyboardEvent) => {
        if (isDisabled) return;

        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
            // focus first enabled item soon after open
            setTimeout(() => {
                const first = listRef.current?.querySelector<HTMLLIElement>(
                    `li[data-disabled="false"]`
                );
                first?.focus();
            }, 0);
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setTimeout(() => {
                const first = listRef.current?.querySelector<HTMLLIElement>(
                    `li[data-disabled="false"]`
                );
                first?.focus();
            }, 0);
        }
    };

    const onItemKeyDown = (e: React.KeyboardEvent, opt: SelectOption) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect(opt);
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = (e.currentTarget.nextElementSibling as HTMLLIElement | null);
            if (next) next.focus();
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = (e.currentTarget.previousElementSibling as HTMLLIElement | null);
            if (prev) prev.focus();
            else buttonRef.current?.focus();
            return;
        }
    };

    return (
        <div ref={rootRef} className={`${styles.root} ${className ?? ""}`}>
            <button
                ref={buttonRef}
                type="button"
                className={`${styles.trigger} ${open && styles.triggerOpen}`}
                onClick={handleToggle}
                onKeyDown={onButtonKeyDown}
                disabled={isDisabled}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={styles.triggerText}>{displayText}</span>
                <AnimatedChevronIcon open={open} />
            </button>

            <div
                className={styles.popover}
                data-open={open ? "true" : "false"}
                aria-hidden={!open}
            >
                <ul ref={listRef} className={styles.list} role="listbox" aria-label={ariaLabel}>
                    {options.map((opt) => {
                        const isSelected = opt.value === value;
                        const disabledItem = !!opt.disabled;

                        return (
                            <li
                                key={opt.value}
                                role="option"
                                aria-selected={isSelected}
                                tabIndex={open && !disabledItem ? 0 : -1}
                                data-selected={isSelected ? "true" : "false"}
                                data-disabled={disabledItem ? "true" : "false"}
                                className={styles.item}
                                onClick={() => handleSelect(opt)}
                                onKeyDown={(e) => onItemKeyDown(e, opt)}
                            >
                                <span className={styles.itemLabel}>{opt.label}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}