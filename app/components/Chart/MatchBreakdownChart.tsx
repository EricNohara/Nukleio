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

import { ISkillsMatchScore } from "@/app/interfaces/ICachedCoverLetter";

import styles from "./MatchBreakdownChart.module.css";

type Props = {
    breakdown: ISkillsMatchScore | null | undefined;
    height?: number | string;
};

function clamp100(n: unknown) {
    const x = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(100, x));
}

export default function MatchBreakdownChart({
    breakdown,
}: Props) {
    const data = useMemo(() => {
        if (!breakdown) return [];

        return [
            {
                name: "Overall",
                value: clamp100(breakdown.overall),
                explanation: null,
            },
            {
                name: "Skills",
                value: clamp100(breakdown.skills),
                explanation: breakdown.explanations.skills,
            },
            {
                name: "Experience",
                value: clamp100(breakdown.experience),
                explanation: breakdown.explanations.experience,
            },
            {
                name: "Projects",
                value: clamp100(breakdown.projects),
                explanation: breakdown.explanations.projects,
            },
            {
                name: "Education",
                value: clamp100(breakdown.education),
                explanation: breakdown.explanations.education,
            },
            {
                name: "Location",
                value: clamp100(breakdown.location),
                explanation: breakdown.explanations.location,
            },
        ];
    }, [breakdown]);

    // No data state (mirrors your pattern)
    if (!data) {
        return (
            <div className={styles.root}>
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
        <div className={styles.root}>
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

                                const p = payload[0]?.payload as {
                                    name?: string;
                                    value?: number;
                                    explanation?: string | null;
                                };

                                if (!p?.name) return null;

                                return (
                                    <div className={styles.tooltipContainer}>
                                        <div className={styles.tooltipTitle}>
                                            {p.name}: {Math.round(Number(p.value ?? 0))}%
                                        </div>

                                        {p.explanation && (
                                            <div className={styles.tooltipSubtitle}>
                                                {p.explanation}
                                            </div>
                                        )}
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