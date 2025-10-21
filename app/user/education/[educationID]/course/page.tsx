import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import CoursesPage from "./CoursesPage";

export default function CoursesPageWrapper({ params, }: { params: { educationID: string }; }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CoursesPage educationID={params.educationID} />
    </Suspense>
  );
}
