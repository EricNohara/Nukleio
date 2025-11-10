"use client";

import { ReactNode } from "react"
import { useState } from "react";

import styles from "./PageContentWrapper.module.css";
import Navigation from "../Navigation/Navigation";
import SearchBar from "./SearchBar/SearchBar";
import UserDropdown from "./UserDropdown/UserDropdown";

interface IPageContentWrapperProps {
    children: ReactNode;
}

export default function PageContentWrapper({ children }: IPageContentWrapperProps) {
    const [searchActive, setSearchActive] = useState(false);

    return (
        <div className={styles.pageContainer} >
            <Navigation />
            <div className={styles.pageContentContainer}>
                {searchActive && <div className={styles.overlay} />}
                <div className={styles.pageContentHeader}>
                    <SearchBar onFocusChange={setSearchActive} />
                    <UserDropdown />
                </div>
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}