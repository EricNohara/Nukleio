"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "../context/UserProvider";

// import UserList from "./user-list";
import PageContentWrapper from "../components/PageContentWrapper/PageContentWrapper";
import RecentActivityChart from "../components/Chart/RecentActivityChart";
import SuccessFailureDonut from "../components/Chart/SuccessFailureDonut";
import TopConnectionsDonut from "../components/Chart/TopConnectionsDonut";
import RecentLatencyChart from "../components/Chart/RecentLatencyChart";

import styles from "./UserHomePage.module.css";

export default function UserHomePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const { state } = useUser();

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
      {user ? (
        <div className={styles.grid}>
          <div className={styles.recentActivity}>
            <RecentActivityChart />
          </div>

          <div className={styles.recentLatency}>
            <RecentLatencyChart />
          </div>

          <div className={styles.successFailure}>
            <SuccessFailureDonut successCount={123} failedCount={100} />
          </div>

          <div className={styles.topConnections}>
            <TopConnectionsDonut />
          </div>

        </div>
      ) : null}
    </PageContentWrapper>
  );
}
