"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "./UserHomePage.module.css";
import RecentActivityChart from "../components/Chart/RecentActivityChart";
import RecentLatencyHistogram from "../components/Chart/RecentLatencyHistogram";
import SuccessFailureDonut from "../components/Chart/SuccessFailureDonut";
import TopConnectionsDonut from "../components/Chart/TopConnectionsDonut";
import PageContentHeader, { IButton } from "../components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "../components/PageContentWrapper/PageContentWrapper";
import IUser from "../interfaces/IUser";

export default function UserHomePage() {
  const router = useRouter();

  const [user, setUser] = useState<IUser | null>(null);

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

  const refreshButton: IButton = {
    name: "Refresh",
    onClick: () => {
    }
  }

  return (
    <PageContentWrapper>
      <PageContentHeader title="Dashboard" buttonOne={refreshButton} />
      {user ? (
        <div className={styles.grid}>
          <div className={styles.recentActivity}>
            <RecentActivityChart height="100%" />
          </div>

          <div className={styles.recentLatency}>
            <RecentLatencyHistogram height="100%" />
          </div>

          <div className={styles.topConnections}>
            <TopConnectionsDonut height="100%" />
          </div>

          <div className={styles.successFailure}>
            <SuccessFailureDonut height="100%" />
          </div>

        </div>
      ) : null}
    </PageContentWrapper>
  );
}
