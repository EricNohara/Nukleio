"use client";

import SettingsContentWithNav from "@/app/components/Navigation/SettingsNav/SettingsContentWithNav";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";

import EditUserForm from "./EditUserForm";

export default function UserSettingsPage() {
    return (
        <PageContentWrapper>
            <PageContentHeader title="Settings" />
            <SettingsContentWithNav activeSetting="User Settings">
                <EditUserForm />
            </SettingsContentWithNav>
        </PageContentWrapper>
    );
}
