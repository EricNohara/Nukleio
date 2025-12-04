import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import CoverLetterPage from "./CoverLetterPage";

export default function ConnectPageWrapper() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <CoverLetterPage />
        </Suspense>
    );
}
