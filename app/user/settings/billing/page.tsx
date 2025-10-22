"use client";

import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import SettingsContentWithNav from "@/app/components/Navigation/SettingsNav/SettingsContentWithNav";

export default function BillingSettingsPage() {
    return (
        <PageContentWrapper>
            <PageContentHeader title="Settings" />
            <SettingsContentWithNav activeSetting="Billing">
                <p>Billing Settings...</p>
            </SettingsContentWithNav>
        </PageContentWrapper>
    );
}
