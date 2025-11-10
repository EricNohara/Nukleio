import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import EducationPage from "./EducationPage";

export default function EducationPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EducationPage />
    </Suspense>
  );
}
