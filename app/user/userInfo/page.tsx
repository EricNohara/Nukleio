"use client";

import { useMemo, useState } from "react";

import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import { IButton } from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import Snackbar from "@/app/components/Snackbar/Snackbar";

import EditUserForm from "./EditUserForm";




type SnackbarState = {
    message: string;
    messageDescription: string;
    variant: "success" | "error";
} | null;

export default function UserInfoPage() {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [snackbar, setSnackbar] = useState<SnackbarState>(null);

    const formId = "edit-user-form";

    const buttonOne: IButton = useMemo(() => {
        if (!isEditing) {
            return {
                name: "Edit",
                onClick: () => setIsEditing(true),
                type: "button",
            };
        }

        return {
            name: "Save Changes",
            type: "submit",
            form: formId,
            disabled: isSaving,
            isLoading: isSaving,
            isAsync: true
        };
    }, [isEditing, isSaving, formId]);

    const buttonFour: IButton | null = useMemo(() => (
        isEditing
            ? { name: "Cancel", onClick: () => setIsEditing(false) }
            : null
    ), [isEditing]);

    return (
        <PageContentWrapper>
            <PageContentHeader title="User Information" buttonOne={buttonOne} buttonFour={buttonFour} />
            <EditUserForm
                formId={formId}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                setIsSaving={setIsSaving}
                setSnackbar={setSnackbar}
            />

            {snackbar && (
                <Snackbar
                    message={snackbar.message}
                    messageDescription={snackbar.messageDescription}
                    variant={snackbar.variant}
                    duration={4000}
                    onClose={() => setSnackbar(null)}
                />
            )}
        </PageContentWrapper>
    );
}