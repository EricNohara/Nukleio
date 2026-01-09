"use client";

import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";


import { useUser } from "@/app/context/UserProvider";
import type { IApiKeyInternal } from "@/app/interfaces/IApiKey";
import { generateShades } from "@/utils/general/colors";
import { createClient } from "@/utils/supabase/client";

import styles from "./DonutChart.module.css";
import { ButtonOne } from "../Buttons/Buttons";
import LoadingMessageSpinner from "../LoadingMessageSpinner/LoadingMessageSpinner";

type Props = {
    height?: number | string;
    topN?: number;
};

type RpcRow = { name: string; count: number };

function clamp(n: unknown) {
    const x = typeof n === "number" ? n : Number(n);
    return Number.isFinite(x) ? Math.max(0, x) : 0;
}

function formatInt(n: number) {
    return new Intl.NumberFormat().format(Math.round(n));
}

export default function TopConnectionsDonut({
    height = "100%",
    topN = 6,
}: Props) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const { state } = useUser();

    const apiKeys = (state?.api_keys ?? []) as IApiKeyInternal[];

    const [rows, setRows] = React.useState<RpcRow[]>([]);
    const [loading, setLoading] = React.useState(true);

    // 1) Fetch from your RPC
    React.useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);

            // IMPORTANT: change this string to your actual function name if needed
            const { data, error } = await supabase.rpc(
                "get_top_connection_counts_last_7_days"
            );

            if (cancelled) return;

            if (error) {
                console.error("Failed to load top connections", error);
                setRows([]);
                setLoading(false);
                return;
            }

            // Normalize + clamp (no `any`)
            const cleaned = (((data as unknown) as RpcRow[]) ?? []).map((r) => ({
                name: String(r?.name ?? "Unknown"),
                count: clamp(r?.count),
            }));

            setRows(cleaned);
            setLoading(false);
        }

        // Only run once user state exists (so auth/session is likely ready)
        load();

        return () => {
            cancelled = true;
        };
    }, [supabase]);

    // 2) Shape the chart data (topN + other)
    const chartData = React.useMemo(() => {
        const cleaned = (rows ?? [])
            .map((d) => ({ name: d.name || "Unknown", count: clamp(d.count) }))
            .filter((d) => d.count > 0)
            .sort((a, b) => b.count - a.count);

        const top = cleaned.slice(0, topN);
        const rest = cleaned.slice(topN);
        const otherCount = rest.reduce((sum, d) => sum + d.count, 0);

        return otherCount > 0 ? [...top, { name: "Other", count: otherCount }] : top;
    }, [rows, topN]);

    const total = React.useMemo(
        () => chartData.reduce((sum, d) => sum + d.count, 0),
        [chartData]
    );

    const colors = React.useMemo(
        () => generateShades("#378afb", Math.max(chartData.length, 1)),
        [chartData.length]
    );

    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
    const active = activeIndex !== null ? chartData[activeIndex] : null;

    const cx = "50%";
    const cy = "50%";

    function routeToConnectForSlice(sliceName: string) {
        if (sliceName === "Other") {
            router.push("/user/connect");
            return;
        }

        const idx = apiKeys.findIndex(
            (k) => (k.description ?? "").trim() === sliceName.trim()
        );

        router.push(idx >= 0 ? `/user/connect?index=${idx}` : "/user/connect");
    }

    const containerStyle: React.CSSProperties = {
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        height,
    };

    // 3) Render states
    // no data states
    if (loading || !state) {
        return (
            <div className={styles.root} style={containerStyle}>
                <div className={styles.chart} style={{ height: "100%" }}>
                    <LoadingMessageSpinner messages={["Loading metrics..."]} />
                </div>
            </div>
        );
    }

    if (apiKeys.length == 0) {
        return (
            <div
                style={{
                    ...containerStyle,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--page-txt-2)",
                }}
            >
                <p>No connections found</p>
                <ButtonOne onClick={() => { router.push("/user/connect") }}>Connect Now</ButtonOne>
            </div>
        );
    } else if (!chartData.length) {
        return (
            <div
                style={{
                    ...containerStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--page-txt-2)",
                    fontSize: 14
                }}
            >
                No requests in the last 7 days
            </div>
        );
    }

    return (
        <div className={styles.root} style={containerStyle}>
            <div className={styles.chart} style={{ height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="name"
                            cx={cx}
                            cy={cy}
                            innerRadius="60%"
                            outerRadius="90%"
                            startAngle={90}
                            endAngle={-270}
                            isAnimationActive
                            animationBegin={0}
                            animationDuration={900}
                            animationEasing="ease-out"
                            onMouseLeave={() => setActiveIndex(null)}
                            onClick={(_, i) => {
                                const row = chartData[i];
                                if (!row) return;
                                routeToConnectForSlice(row.name);
                            }}
                        >
                            {chartData.map((d, i) => (
                                <Cell
                                    key={`${d.name}-${i}`}
                                    fill={colors[i]}
                                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.55}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    style={{ cursor: d.name === "Other" ? "default" : "pointer" }}
                                />
                            ))}
                        </Pie>

                        {/* Center label */}
                        <g>
                            {active ? (
                                <>
                                    <text
                                        x={cx}
                                        y={cy}
                                        dy={-16}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        className={styles.centerTitle}
                                    >
                                        Requests
                                    </text>
                                    <text
                                        x={cx}
                                        y={cy}
                                        dy={12}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        className={styles.centerValue}
                                    >
                                        {formatInt(active.count)}
                                    </text>
                                </>
                            ) : (
                                <>
                                    <text
                                        x={cx}
                                        y={cy}
                                        dy={-16}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        className={styles.centerTitle}
                                    >
                                        Total Requests
                                    </text>
                                    <text
                                        x={cx}
                                        y={cy}
                                        dy={12}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        className={styles.centerValue}
                                    >
                                        {formatInt(total)}
                                    </text>
                                </>
                            )}
                        </g>

                        <Tooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                const p = payload[0]?.payload as { name?: string } | undefined;
                                if (!p?.name) return null;

                                return (
                                    <div
                                        style={{
                                            fontSize: 14,
                                            padding: "8px 10px",
                                            whiteSpace: "normal",
                                            wordBreak: "break-word",
                                            maxWidth: 320,
                                            background: "var(--page-box-bg)",
                                            border: "1px solid var(--page-box-border)",
                                            borderRadius: "var(--global-border-radius)",
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                        }}
                                    >
                                        {p.name}
                                    </div>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
