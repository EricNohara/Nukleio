"use client";

import { ButtonOne } from "@/app/components/Buttons/Buttons";
import SettingsContentWithNav from "@/app/components/Navigation/SettingsNav/SettingsContentWithNav";
import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import { useUser } from "@/app/context/UserProvider";
import { createClient } from "@/utils/supabase/client";

export default function PasswordSettingsPage() {
    const supabase = createClient();
    const { state } = useUser();

    const onPasswordReset = async () => {
        if (!state || !state.email) return;

        try {
            // send the recovery email
            const { error } = await supabase.auth
                .resetPasswordForEmail(state.email, { redirectTo: `${window.location.origin}/passwordReset` });
            if (error) throw new Error(error.message);
            alert("If an account exists for that email, we'll send a reset link.");
        } catch (error) {
            console.error(error);
            alert(error);
        }
    }

    return (
        <PageContentWrapper>
            <PageContentHeader title="Settings" />
            <SettingsContentWithNav activeSetting="Password">
                <p>Password Settings...</p>
                <ButtonOne onClick={onPasswordReset}>Send Password Reset Email</ButtonOne>
            </SettingsContentWithNav>
        </PageContentWrapper>
    );
}
