"use client";

import React from "react";
import {
    Pie,
    PieChart,
    ResponsiveContainer,
    Cell,
    Tooltip,
} from "recharts";
import styles from "./SuccessFailureDonut.module.css";

type Props = {
    successCount: number;
    failedCount: number;
    height?: number; // px height for the chart area
};

const SUCCESS_COLOR = "#82ca9d";
const FAILED_COLOR = "#F87777";

function clamp(n: number) {
    return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export default function SuccessFailureDonut({
    successCount,
    failedCount,
    height = 260,
}: Props) {
    const success = clamp(successCount);
    const failed = clamp(failedCount);
    const total = success + failed;

    const successRate = total > 0 ? (success / total) * 100 : 0;

    const data = [
        { name: "Successful", value: success, color: SUCCESS_COLOR },
        { name: "Failed", value: failed, color: FAILED_COLOR },
    ];

    return (
        <div className={styles.root}>
            <div className={styles.chart} style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="42%"
                            cy="50%"
                            innerRadius="62%"
                            outerRadius="82%"
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={2}
                            isAnimationActive={true}
                            animationBegin={0}
                            animationDuration={600}
                            animationEasing="ease-out"
                        >
                            {data.map((d, i) => (
                                <Cell key={i} fill={d.color} />
                            ))}
                        </Pie>

                        {/* Center label */}
                        <g className={styles.centerLabel}>
                            <text
                                x="42%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="central"
                                className={styles.centerValue}
                            >
                                {total > 0 ? `${successRate.toFixed(1)}%` : "—"}
                            </text>
                            <text
                                x="42%"
                                y="50%"
                                dy={20}
                                textAnchor="middle"
                                dominantBaseline="central"
                                className={styles.centerSubtext}
                            >
                                {total > 0 ? "Success rate" : "No data"}
                            </text>
                        </g>

                        {/* Optional: keep tooltip disabled (legend+center already cover it) */}
                        <Tooltip content={() => null} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend on the right */}
            <div className={styles.legend}>
                <div className={styles.legendRow}>
                    <span
                        className={styles.legendSwatch}
                        style={{ backgroundColor: SUCCESS_COLOR }}
                    />
                    <div className={styles.legendText}>
                        <div className={styles.legendName}>Successful: <span className={styles.legendValue}>{success}</span></div>
                    </div>
                </div>

                <div className={styles.legendRow}>
                    <span
                        className={styles.legendSwatch}
                        style={{ backgroundColor: FAILED_COLOR }}
                    />
                    <div className={styles.legendText}>
                        <div className={styles.legendName}>Failed: <span className={styles.legendValue}>{failed}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
