import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import ProjectsPage from "./ProjectsPage";

export default function ProjectsPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProjectsPage />
    </Suspense>
  );
}
