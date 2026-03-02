"use client";

import SettingsContentWithNav from "@/app/components/Navigation/SettingsNav/SettingsContentWithNav";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";

import BillingPage from "./BillingPage";

export default function BillingSettingsPage() {
    return (
        <PageContentWrapper>
            <PageContentHeader title="Settings" />
            <SettingsContentWithNav activeSetting="Billing">
                <BillingPage />
            </SettingsContentWithNav>
        </PageContentWrapper>
    );
}
