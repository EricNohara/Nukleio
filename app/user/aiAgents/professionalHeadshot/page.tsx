import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import ProfessionalHeadshotPage from "./ProfessionalHeadshotPage";

export default function ProfessionalHeadshotPageWrapper() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <ProfessionalHeadshotPage />
        </Suspense>
    );
}
