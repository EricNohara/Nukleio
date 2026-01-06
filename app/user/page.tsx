"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// import UserList from "./user-list";
import PageContentWrapper from "../components/PageContentWrapper/PageContentWrapper";
import RecentActivityChart from "../components/Chart/RecentActivityChart";
import SuccessFailureDonut from "../components/Chart/SuccessFailureDonut";

export default function UserHomePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const authenticator = async () => {
      try {
        const res = await fetch("/api/internal/auth/authenticated", { method: "GET" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message);
        }

        setUser(data.user);
      } catch (err) {
        console.error(err);
        router.push("/");
      }
    };

    authenticator();
  }, [router]);

  return (
    <PageContentWrapper>
      {user ? <RecentActivityChart /> : null}
      <SuccessFailureDonut successCount={123} failedCount={100} />

    </PageContentWrapper>
  );
}
