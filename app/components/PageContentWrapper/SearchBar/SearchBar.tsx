"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";

import { useUser } from "@/app/context/UserProvider";

import styles from "./SearchBar.module.css";

interface ISuggestion {
    label: string,
    path: string
}

interface ISearchBarProps {
    onFocusChange?: (active: boolean) => void;
}

const DEFAULT_SUGGESTIONS: ISuggestion[] = [
    { label: "Home", path: "/user" },
    { label: "Documents", path: "/user/documents" },
    { label: "Profile Picture", path: "/user/documents" },
    { label: "Resume", path: "/user/documents" },
    { label: "Transcript", path: "/user/documents" },
    { label: "Experience", path: "/user/experience" },
    { label: "Education", path: "/user/education" },
    { label: "Projects", path: "/user/projects" },
    { label: "Skills", path: "/user/skills" },
    { label: "Connect", path: "/user/connect" },
    { label: "User Settings", path: "/user/settings" },
    { label: "App Settings", path: "/user/settings/app" },
]

export default function SearchBar({ onFocusChange }: ISearchBarProps) {
    const [query, setQuery] = useState<string>("");
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const { state } = useUser();
    const router = useRouter();

    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
    const keyHoldRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // combine static + dynamic suggestions using useMemo
    const suggestions = useMemo(() => {
        const dynamicSuggestions: ISuggestion[] = [];

        if (state) {
            // experiences
            for (const exp of state.experiences) {
                dynamicSuggestions.push({
                    label: exp.company,
                    path: "/user/experience"
                })
            }

            // education
            for (const edu of state.education) {
                dynamicSuggestions.push({
                    label: edu.institution,
                    path: "/user/education"
                })
            }

            // projects
            for (const project of state.projects) {
                dynamicSuggestions.push({
                    label: project.name,
                    path: "/user/projects",
                });
            }

            // skills
            for (const skill of state.skills) {
                dynamicSuggestions.push({
                    label: skill.name,
                    path: "/user/skills"
                })
            }

            // connections
            for (const conn of state.api_keys) {
                dynamicSuggestions.push({
                    label: conn.description,
                    path: "/user/connect"
                })
            }
        }

        // combine and remove duplicates
        const all = [...DEFAULT_SUGGESTIONS, ...dynamicSuggestions];
        const seen = new Set<string>();
        return all.filter((s) => {
            const key = s.label.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [state]);

    const filtered = suggestions.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setActiveIndex(-1);
        setShowDropdown(value.length > 0)
    }

    const handleSelect = (path: string) => {
        setQuery("");
        setShowDropdown(false);
        setActiveIndex(-1);
        router.push(path);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.length == 0) {
            inputRef.current?.blur();
            return;
        }

        if (filtered.length > 0) {
            const target = activeIndex >= 0 ? filtered[activeIndex] : filtered[0];
            handleSelect(target.path);
        } else {
            setShowDropdown(false);
        }
    };

    // helper
    const moveActiveIndex = (key: string) => {
        setActiveIndex((prev) => {
            if (key === "ArrowDown") {
                return (prev + 1) % filtered.length;
            } else {
                return prev <= 0 ? filtered.length - 1 : prev - 1;
            }
        });
    };

    // handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setShowDropdown(false);
            setQuery("");
            setActiveIndex(-1);
            inputRef.current?.blur();
        }

        if (!showDropdown || filtered.length === 0) return;

        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();

            if (!keyHoldRef.current) {
                moveActiveIndex(e.key);
                keyHoldRef.current = setInterval(() => {
                    moveActiveIndex(e.key);
                }, 150);
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filtered.length) {
                handleSelect(filtered[activeIndex].path);
            } else if (filtered.length > 0) {
                handleSelect(filtered[0].path);
            }
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            if (keyHoldRef.current) {
                clearInterval(keyHoldRef.current);
                keyHoldRef.current = null;
            }
        }
    };

    // close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
                setQuery("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // scroll to active item if needed
    useEffect(() => {
        if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
            itemRefs.current[activeIndex]?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [activeIndex]);

    const handleFocus = () => onFocusChange?.(true);
    const handleBlur = () => {
        // give a tiny delay so click on dropdown items works
        setTimeout(() => onFocusChange?.(false), 100);
    };

    return (
        <div
            className={styles.searchBarWrapper}
            ref={containerRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            <form className={styles.searchBarForm} onSubmit={handleSubmit}>
                <Search />
                <input
                    type="text"
                    ref={inputRef}
                    value={query}
                    onChange={handleChange}
                    placeholder="Search..."
                    className={styles.searchBarInput}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                />
            </form>

            {showDropdown && filtered.length > 0 && (
                <ul className={styles.dropdown}>
                    {filtered.map((item, index) => (
                        <li
                            key={index}
                            ref={(el) => { itemRefs.current[index] = el }}
                            className={`${styles.dropdownItem} ${index === activeIndex ? styles.activeItem : ""}`}
                            onClick={() => handleSelect(item.path)}
                        >
                            {item.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}