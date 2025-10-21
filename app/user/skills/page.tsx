import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import SkillsPage from "./SkillsPage";

export default function SkillsPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SkillsPage />
    </Suspense>
  );
}
