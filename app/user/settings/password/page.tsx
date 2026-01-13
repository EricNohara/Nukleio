"use client";

import SettingsContentWithNav from "@/app/components/Navigation/SettingsNav/SettingsContentWithNav";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";

import ResetPasswordForm from "./ResetPasswordForm";

export default function PasswordSettingsPage() {
    return (
        <PageContentWrapper>
            <PageContentHeader title="Settings" />
            <SettingsContentWithNav activeSetting="Password">
                <ResetPasswordForm />
            </SettingsContentWithNav>
        </PageContentWrapper>
    );
}
