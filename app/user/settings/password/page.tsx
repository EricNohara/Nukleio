"use client";

import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import SettingsContentWithNav from "@/app/components/Navigation/SettingsNav/SettingsContentWithNav";

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
