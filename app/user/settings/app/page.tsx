"use client";

import SettingsContentWithNav from "@/app/components/Navigation/SettingsNav/SettingsContentWithNav";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";

import EditAppForm from "./EditAppForm";

export default function AppSettingsPage() {
    return (
        <PageContentWrapper>
            <PageContentHeader title="Settings" />
            <SettingsContentWithNav activeSetting="App Settings">
                <EditAppForm />
            </SettingsContentWithNav>
        </PageContentWrapper>
    );
}
