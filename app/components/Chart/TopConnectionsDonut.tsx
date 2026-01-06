"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import styles from "./DonutChart.module.css";
import { generateShades } from "@/utils/general/colors";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/app/context/UserProvider";
import type { IApiKeyInternal } from "@/app/interfaces/IApiKey";

type RpcRow = { name: string; count: number };

function clamp(n: unknown) {
    const x = typeof n === "number" ? n : Number(n);
    return Number.isFinite(x) ? Math.max(0, x) : 0;
}

function formatInt(n: number) {
    return new Intl.NumberFormat().format(Math.round(n));
}

export default function TopConnectionsDonut({
    height = 280,
    topN = 6,
}: {
    height?: number;
    topN?: number;
}) {
    const router = useRouter();
    const supabase = createClient();
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

            // Normalize + clamp
            const cleaned = ((data ?? []) as any[]).map((r) => ({
                name: String(r?.name ?? "Unknown"),
                count: clamp(r?.count),
            }));

            setRows(cleaned);
            setLoading(false);
        }

        // Only run once user state exists (so auth/session is likely ready)
        if (state) load();

        return () => {
            cancelled = true;
        };
    }, [state, supabase]);

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

        // match the SearchBar approach: find correct index in state.api_keys
        const idx = apiKeys.findIndex(
            (k) => (k.description ?? "").trim() === sliceName.trim()
        );

        router.push(idx >= 0 ? `/user/connect?index=${idx}` : "/user/connect");
    }

    // 3) Render states
    if (loading) {
        return (
            <div className={styles.root}>
                <div className={styles.chart} style={{ height }}>
                    <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                        <span style={{ fontSize: 13, color: "#6b7280" }}>Loading…</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!chartData.length || total === 0) {
        return (
            <div className={styles.root}>
                <div className={styles.chart} style={{ height }}>
                    <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                        <span style={{ fontSize: 13, color: "#6b7280" }}>No requests yet</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.root}>
            <div className={styles.chart} style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="name"
                            cx={cx}
                            cy={cy}
                            innerRadius="56%"
                            outerRadius="90%"
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={2}
                            isAnimationActive
                            animationDuration={700}
                            animationEasing="ease-out"
                            onMouseMove={(_, i) => setActiveIndex(i)}
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
                                            fontSize: 12,
                                            padding: "8px 10px",
                                            whiteSpace: "normal",
                                            wordBreak: "break-word",
                                            maxWidth: 320,
                                            background: "white",
                                            border: "1px solid rgba(0,0,0,0.12)",
                                            borderRadius: 10,
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
