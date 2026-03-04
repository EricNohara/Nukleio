"use client";

import React, { useMemo } from "react";
import {
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Tooltip,
} from "recharts";

import styles from "./MatchBreakdownChart.module.css";

export type MatchBreakdown = {
    education: number;
    experience: number;
    skills: number;
    projects: number;
    location: number;
    overall: number;
};

type Props = {
    breakdown: MatchBreakdown | null | undefined;
    height?: number | string;
};

function clamp100(n: unknown) {
    const x = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(100, x));
}

export default function MatchBreakdownChart({
    breakdown,
    height = "100%",
}: Props) {
    const containerStyle: React.CSSProperties = {
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        height,
    };
    const data = useMemo(() => {
        if (!breakdown) return [];

        const education = clamp100(breakdown.education);
        const experience = clamp100(breakdown.experience);
        const skills = clamp100(breakdown.skills);
        const projects = clamp100(breakdown.projects);
        const location = clamp100(breakdown.location);
        const overall = clamp100(breakdown.overall);

        return [
            { name: "Overall", value: overall },
            { name: "Skills", value: skills },
            { name: "Experience", value: experience },
            { name: "Projects", value: projects },
            { name: "Education", value: education },
            { name: "Location", value: location },
        ];
    }, [breakdown]);

    // No data state (mirrors your pattern)
    if (!data) {
        return (
            <div className={styles.root} style={containerStyle}>
                <div
                    style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--page-txt-2)",
                        fontSize: 14,
                    }}
                >
                    No skill match data
                </div>
            </div>
        );
    }

    return (
        <div className={styles.root} style={containerStyle}>
            <div className={styles.chart} style={{ height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data} outerRadius="72%">
                        <PolarGrid />
                        <PolarAngleAxis
                            dataKey="name"
                            tick={{ fontSize: "0.8rem", fill: "var(--page-txt-1)", fontWeight: "bold" }}
                        />
                        <PolarRadiusAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: "var(--page-txt-2)" }}
                            tickCount={5}
                        />

                        <Radar
                            name="Match"
                            dataKey="value"
                            stroke="var(--btn-1)"
                            fill="var(--btn-1)"
                            fillOpacity={0.2}
                            isAnimationActive
                            animationDuration={900}
                            animationEasing="ease-out"
                        />

                        <Tooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                const p = payload[0]?.payload as { name?: string; value?: number } | undefined;
                                if (!p?.name) return null;

                                return (
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            fontWeight: "bold",
                                            padding: "0.5rem 1rem",
                                            whiteSpace: "normal",
                                            wordBreak: "break-word",
                                            background: "var(--page-box-bg)",
                                            color: "var(--page-txt-1)",
                                            border: "1px solid var(--page-box-border)",
                                            borderRadius: "var(--global-border-radius)",
                                        }}
                                    >
                                        <div>{p.name}: {Math.round(Number(p.value ?? 0))}%</div>
                                    </div>
                                );
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}