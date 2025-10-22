"use client";

import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import SettingsContentWithNav from "@/app/components/Navigation/SettingsNav/SettingsContentWithNav";

export default function AppSettingsPage() {
    return (
        <PageContentWrapper>
            <PageContentHeader title="Settings" />
            <SettingsContentWithNav activeSetting="App Settings">
                <p>App Settings...</p>
            </SettingsContentWithNav>
        </PageContentWrapper>
    );
}
