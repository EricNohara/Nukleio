import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import ConnectPage from "./ConnectPage";

export default function ConnectPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ConnectPage />
    </Suspense>
  );
}
