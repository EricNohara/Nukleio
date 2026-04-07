import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import AiAgentsPage from "./AiAgentsPage";

export default function ConnectPageWrapper() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AiAgentsPage />
        </Suspense>
    );
}
