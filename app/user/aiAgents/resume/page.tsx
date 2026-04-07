import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import ResumePage from "./ResumePage";

export default function ConnectPageWrapper() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <ResumePage />
        </Suspense>
    );
}
