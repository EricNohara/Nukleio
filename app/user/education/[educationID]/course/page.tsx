import { Suspense } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

import CoursesPage from "./CoursesPage";

export default async function CoursesPageWrapper({ params, }: { params: Promise<{ educationID: string }> }) {
  const { educationID } = await params;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CoursesPage educationID={educationID} />
    </Suspense>
  );
}
