"use client";

import { Clock, CircleArrowUp, Zap, CircleCheck, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import styles from "./UserHomePage.module.css";
import RecentActivityChart from "../components/Chart/RecentActivityChart";
import RecentLatencyHistogram from "../components/Chart/RecentLatencyHistogram";
import SuccessFailureDonut from "../components/Chart/SuccessFailureDonut";
import TopConnectionsDonut from "../components/Chart/TopConnectionsDonut";
import PageContentHeader, { IButton } from "../components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "../components/PageContentWrapper/PageContentWrapper";

type InfoKey = "recentActivity" | "recentLatency" | "topConnections" | "successFailure" | null;

const INFO_COPY: Record<Exclude<InfoKey, null>, { title: string; body: string }> = {
  recentActivity: {
    title: "Recent Activity",
    body: "Shows how many successful and failed requests were made during the last 7 days. Use it to spot spikes or unusual usage patterns.",
  },
  recentLatency: {
    title: "Recent Latency Distribution",
    body: "A histogram of request latency. Use it to understand the distribution of response times to better understand how long it takes for requests to complete.",
  },
  topConnections: {
    title: "Top Connections",
    body: "Breakdown of the most frequent connections by api keys used. Useful for identifying api keys based on their overall usage.",
  },
  successFailure: {
    title: "Availability",
    body: "Compares successful vs failed requests. A quick health check to see if errors are increasing.",
  },
};

export default function UserHomePage() {
  const router = useRouter();

  const [openInfo, setOpenInfo] = useState<InfoKey>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const authenticator = async () => {
      try {
        const res = await fetch("/api/internal/auth/authenticated", { method: "GET" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
      } catch (err) {
        console.error(err);
        router.push("/");
      }
    };

    authenticator();
  }, [router]);

  // Close popover on outside click
  useEffect(() => {
    if (!openInfo) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = popoverRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpenInfo(null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenInfo(null);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openInfo]);

  const refreshButton: IButton = {
    name: "Refresh",
    onClick: () => window.location.reload(),
  };

  const toggleInfo = (key: Exclude<InfoKey, null>) => {
    setOpenInfo((prev) => (prev === key ? null : key));
  };

  return (
    <PageContentWrapper>
      <PageContentHeader title="Home Dashboard" buttonOne={refreshButton} />

      <div className={styles.grid}>
        <div className={styles.recentActivity}>
          <div className={styles.chartTitleContainer}>
            <div className={styles.chartTitle}>
              <Clock size={20} />
              <h3>Recent Activity</h3>
            </div>

            <div className={styles.infoWrap} ref={openInfo === "recentActivity" ? popoverRef : null}>
              <button
                type="button"
                className={styles.infoButton}
                onClick={() => toggleInfo("recentActivity")}
                aria-label="Info: Recent Activity"
                aria-expanded={openInfo === "recentActivity"}
              >
                <Info size={20} />
              </button>

              {openInfo === "recentActivity" ? (
                <div className={styles.popover} role="dialog" aria-label="Recent Activity info">
                  <div className={styles.popoverTitle}>{INFO_COPY.recentActivity.title}</div>
                  <div className={styles.popoverBody}>{INFO_COPY.recentActivity.body}</div>
                </div>
              ) : null}
            </div>
          </div>

          <RecentActivityChart height="90%" />
        </div>

        <div className={styles.recentLatency}>
          <div className={styles.chartTitleContainer}>
            <div className={styles.chartTitle}>
              <Zap size={20} />
              <h3>Recent Latency Distribution</h3>
            </div>

            <div className={styles.infoWrap} ref={openInfo === "recentLatency" ? popoverRef : null}>
              <button
                type="button"
                className={styles.infoButton}
                onClick={() => toggleInfo("recentLatency")}
                aria-label="Info: Recent Latency"
                aria-expanded={openInfo === "recentLatency"}
              >
                <Info size={20} />
              </button>

              {openInfo === "recentLatency" ? (
                <div className={styles.popover} role="dialog" aria-label="Recent Latency info">
                  <div className={styles.popoverTitle}>{INFO_COPY.recentLatency.title}</div>
                  <div className={styles.popoverBody}>{INFO_COPY.recentLatency.body}</div>
                </div>
              ) : null}
            </div>
          </div>

          <RecentLatencyHistogram height="90%" />
        </div>

        <div className={styles.topConnections}>
          <div className={styles.chartTitleContainer}>
            <div className={styles.chartTitle}>
              <CircleArrowUp size={20} />
              <h3>Top Connections</h3>
            </div>

            <div className={styles.infoWrap} ref={openInfo === "topConnections" ? popoverRef : null}>
              <button
                type="button"
                className={styles.infoButton}
                onClick={() => toggleInfo("topConnections")}
                aria-label="Info: Top Connections"
                aria-expanded={openInfo === "topConnections"}
              >
                <Info size={20} />
              </button>

              {openInfo === "topConnections" ? (
                <div className={styles.popover} role="dialog" aria-label="Top Connections info">
                  <div className={styles.popoverTitle}>{INFO_COPY.topConnections.title}</div>
                  <div className={styles.popoverBody}>{INFO_COPY.topConnections.body}</div>
                </div>
              ) : null}
            </div>
          </div>

          <TopConnectionsDonut height="90%" />
        </div>

        <div className={styles.successFailure}>
          <div className={styles.chartTitleContainer}>
            <div className={styles.chartTitle}>
              <CircleCheck size={20} />
              <h3>Availability</h3>
            </div>

            <div className={styles.infoWrap} ref={openInfo === "successFailure" ? popoverRef : null}>
              <button
                type="button"
                className={styles.infoButton}
                onClick={() => toggleInfo("successFailure")}
                aria-label="Info: Availability"
                aria-expanded={openInfo === "successFailure"}
              >
                <Info size={20} />
              </button>

              {openInfo === "successFailure" ? (
                <div className={styles.popover} role="dialog" aria-label="Availability info">
                  <div className={styles.popoverTitle}>{INFO_COPY.successFailure.title}</div>
                  <div className={styles.popoverBody}>{INFO_COPY.successFailure.body}</div>
                </div>
              ) : null}
            </div>
          </div>

          <SuccessFailureDonut height="90%" />
        </div>
      </div>

    </PageContentWrapper>
  );
}
