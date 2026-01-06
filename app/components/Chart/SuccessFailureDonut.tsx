"use client";

import React from "react";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import styles from "./DonutChart.module.css";
import { createClient } from "@/utils/supabase/client";

type Props = {
    height?: number;
};

const SUCCESS_COLOR = "#82ca9d";
const FAILED_COLOR = "#F87777";

function clamp(n: number) {
    return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function formatInt(n: number) {
    return new Intl.NumberFormat().format(Math.round(n));
}

type RpcRow = {
    success: number | null;
    failed: number | null;
};

export default function SuccessFailureDonut({ height = 280 }: Props) {
    const supabase = createClient();

    const [successCount, setSuccessCount] = React.useState(0);
    const [failedCount, setFailedCount] = React.useState(0);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);

            const { data, error } = await supabase.rpc(
                "get_api_success_failure_counts_last_7_days"
            );

            if (cancelled) return;

            if (error) {
                console.error("Failed to load success/failure counts", error);
                setSuccessCount(0);
                setFailedCount(0);
                setLoading(false);
                return;
            }

            const row = (Array.isArray(data) ? data[0] : data) as RpcRow | undefined;

            setSuccessCount(Number(row?.success ?? 0));
            setFailedCount(Number(row?.failed ?? 0));
            setLoading(false);
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [supabase]);

    const success = clamp(successCount);
    const failed = clamp(failedCount);
    const total = success + failed;

    const data = [
        { name: "Successful", value: success, color: SUCCESS_COLOR },
        { name: "Failed", value: failed, color: FAILED_COLOR },
    ];

    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
    const active = activeIndex !== null ? data[activeIndex] : null;

    const cx = "50%";
    const cy = "50%";

    return (
        <div className={styles.root}>
            <div className={styles.chart} style={{ height }}>
                {loading ? (
                    <div
                        style={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            color: "#6b7280",
                        }}
                    >
                        Loading…
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx={cx}
                                cy={cy}
                                innerRadius="56%"
                                outerRadius="90%"
                                startAngle={90}
                                endAngle={-270}
                                paddingAngle={2}
                                isAnimationActive
                                animationBegin={0}
                                animationDuration={700}
                                animationEasing="ease-out"
                                onMouseMove={(_, i) => setActiveIndex(i)}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                {data.map((d, i) => (
                                    <Cell
                                        key={d.name}
                                        fill={d.color}
                                        opacity={activeIndex === null || activeIndex === i ? 1 : 0.55}
                                    />
                                ))}
                            </Pie>

                            {/* Center label (stacked + vertically centered) */}
                            <g>
                                {total > 0 ? (
                                    active ? (
                                        <>
                                            <text
                                                x={cx}
                                                y={cy}
                                                dy={-16}
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                                className={styles.centerTitle}
                                            >
                                                {active.name === "Failed" ? "Failed Count" : "Success Count"}
                                            </text>
                                            <text
                                                x={cx}
                                                y={cy}
                                                dy={12}
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                                className={styles.centerValue}
                                            >
                                                {formatInt(active.value)}
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
                                                Availability
                                            </text>
                                            <text
                                                x={cx}
                                                y={cy}
                                                dy={12}
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                                className={styles.centerValue}
                                            >
                                                {((success / total) * 100).toFixed(1)}%
                                            </text>
                                        </>
                                    )
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
                                            No data
                                        </text>
                                        <text
                                            x={cx}
                                            y={cy}
                                            dy={12}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            className={styles.centerValue}
                                        >
                                            —
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
                )}
            </div>
        </div>
    );
}
