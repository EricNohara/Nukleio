import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import CoverLetterDescriptionModePage from "./CoverLetterDescriptionModePage";

export default function EducationPageWrapper() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <CoverLetterDescriptionModePage />
        </Suspense>
    );
}
