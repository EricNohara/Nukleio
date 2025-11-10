"use client";

import SettingsContentWithNav from "@/app/components/Navigation/SettingsNav/SettingsContentWithNav";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";

export default function PasswordSettingsPage() {
    return (
        <PageContentWrapper>
            <PageContentHeader title="Settings" />
            <SettingsContentWithNav activeSetting="Password">
                <p>Password Settings...</p>
            </SettingsContentWithNav>
        </PageContentWrapper>
    );
}
