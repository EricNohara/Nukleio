"use client";

import { X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import styles from "./AutocompleteListSelector.module.css";

type SuggestionData = { titles: string[] };

type Props = {
    label: string;
    name: "languages_used" | "frameworks_used" | "technologies_used";
    value: string[];
    suggestionsData: SuggestionData; // imported JSON
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    maxSuggestions?: number;
    className?: string;
};

export default function AutocompleteListSelector({
    label,
    name,
    value,
    suggestionsData,
    onChange,
    placeholder = "Type and press Enter…",
    disabled = false,
    maxSuggestions = 8,
    className
}: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1);

    // Make lookup sets for fast dedupe
    const selectedKeySet = useMemo(() => {
        const s = new Set<string>();
        for (const item of value ?? []) s.add(item.trim().toLowerCase());
        return s;
    }, [value]);

    const suggestions = useMemo(
        () => suggestionsData?.titles ?? [],
        [suggestionsData]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return []; // no suggestions until user types

        return suggestions
            .filter((t) => !selectedKeySet.has(t.toLowerCase()))
            .filter((t) => t.toLowerCase().includes(q))
            .slice(0, maxSuggestions);
    }, [query, suggestions, selectedKeySet, maxSuggestions]);

    const emitList = (nextList: string[]) => {
        const csv = nextList.join(", ");
        const syntheticEvent = {
            target: { name, value: csv },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
    };

    const normalizeTyped = (s: string) => s.trim().replace(/\s+/g, " ");

    const addItem = (raw: string) => {
        const cleaned = normalizeTyped(raw);
        if (!cleaned) return;

        const key = cleaned.toLowerCase();
        if (selectedKeySet.has(key)) {
            setQuery("");
            setIsOpen(false);
            setActiveIndex(-1);
            return;
        }

        const next = [...(value ?? []), cleaned];
        emitList(next);

        setQuery("");
        setIsOpen(false);
        setActiveIndex(-1);

        // keep focus for rapid entry
        requestAnimationFrame(() => {
            const el = containerRef.current?.querySelector(`.${styles.chips}`);
            if (el) el.scrollLeft = el.scrollWidth;
        });
    };

    const removeItem = (idx: number) => {
        const next = (value ?? []).filter((_, i) => i !== idx);
        emitList(next);
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex((prev) => {
                const next = prev + 1;
                return next >= filtered.length ? 0 : next;
            });
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex((prev) => {
                const next = prev - 1;
                return next < 0 ? Math.max(filtered.length - 1, 0) : next;
            });
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            if (isOpen && activeIndex >= 0 && activeIndex < filtered.length) {
                addItem(filtered[activeIndex]);
            } else {
                addItem(query);
            }
            return;
        }

        if (e.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
            return;
        }

        if (e.key === "Backspace" && !query) {
            // Backspace removes last chip if input is empty
            if ((value?.length ?? 0) > 0) removeItem((value?.length ?? 1) - 1);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const onDocMouseDown = (ev: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(ev.target as Node)) {
                setIsOpen(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, []);

    return (
        <div ref={containerRef} className={`${styles.wrapper} ${className && className}`}>
            <p className={styles.label}>{label}</p>

            <div
                className={`${styles.inputShell} ${disabled ? styles.disabled : ""}`}
                onClick={() => {
                    inputRef.current?.focus();
                    setIsOpen(query.trim().length > 0);
                }}
            >
                <div className={styles.chips}>
                    {(value ?? [])
                        .filter((v) => v && v.trim().length > 0)
                        .map((item, idx) => (
                            <span key={`${item}-${idx}`} className={styles.chip}>
                                <span className={styles.chipText}>{item}</span>
                                {!disabled && (
                                    <button
                                        type="button"
                                        className={styles.chipRemove}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeItem(idx);
                                        }}
                                        aria-label={`Remove ${item}`}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </span>
                        ))}

                    <input
                        ref={inputRef}
                        className={styles.input}
                        value={query}
                        disabled={disabled}
                        placeholder={(value?.length ?? 0) === 0 ? placeholder : ""}
                        onFocus={() => setIsOpen(query.trim().length > 0)}
                        onChange={(e) => {
                            const next = e.target.value;
                            setQuery(next);
                            setIsOpen(next.trim().length > 0);
                            setActiveIndex(-1);
                        }}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
            </div>

            {isOpen && filtered.length > 0 && !disabled && (
                <div className={styles.dropdown} role="listbox">
                    {filtered.map((item, idx) => (
                        <button
                            type="button"
                            key={item}
                            className={`${styles.item} ${idx === activeIndex ? styles.active : ""}`}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onMouseDown={(e) => e.preventDefault()} // prevent input blur
                            onClick={() => addItem(item)}
                            role="option"
                            aria-selected={idx === activeIndex}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}