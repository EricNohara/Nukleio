import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import ExperiencePage from "./ExperiencePage";

export default function ExperiencePageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ExperiencePage />
    </Suspense>
  );
}
