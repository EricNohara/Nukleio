"use client";

import { useMemo, useState } from "react";

import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import { IButton } from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";

import EditUserForm from "./EditUserForm";

export default function UserInfoPage() {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

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
            />
        </PageContentWrapper>
    );
}