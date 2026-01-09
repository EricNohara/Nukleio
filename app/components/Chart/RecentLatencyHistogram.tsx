"use client";

import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { useUser } from "@/app/context/UserProvider";
import { createClient } from "@/utils/supabase/client";

import { ButtonOne } from "../Buttons/Buttons";
import LoadingMessageSpinner from "../LoadingMessageSpinner/LoadingMessageSpinner";

type RpcRow = { latency_ms: number };

type HistRow = {
    bucket: string;
    start: number;
    count: number;
};

function clampNumber(n: unknown, fallback = 0) {
    const x = typeof n === "number" ? n : Number(n);
    return Number.isFinite(x) ? x : fallback;
}

function buildHistogram(values: number[], binSizeMs: number, maxMs?: number): HistRow[] {
    if (!values.length) return [];

    const max = Math.max(...values);
    const cap = typeof maxMs === "number" ? Math.max(0, maxMs) : max;

    const numBins = Math.max(1, Math.ceil((cap + 1) / binSizeMs));
    const bins: HistRow[] = Array.from({ length: numBins }, (_, i) => {
        const from = i * binSizeMs;
        const to = from + binSizeMs;
        return { bucket: `${from}–${to}`, start: from, count: 0 };
    });

    for (const v of values) {
        const val = Math.max(0, v);
        const idx = Math.min(numBins - 1, Math.floor(val / binSizeMs));
        bins[idx].count += 1;
    }

    return bins;
}

export default function RecentLatencyHistogram({
    height = "100%",
    binSizeMs = 50,
    maxMs = 2000,
}: {
    height?: number | string;
    binSizeMs?: number;
    maxMs?: number;
}) {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    const { state } = useUser();
    const [rows, setRows] = React.useState<HistRow[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);

            const { data, error } = await supabase.rpc("get_api_latency_samples_last_7_days");
            if (cancelled) return;

            if (error) {
                console.error("Failed to load latency samples", error);
                setRows([]);
                setLoading(false);
                return;
            }

            const samples = ((data ?? []) as RpcRow[])
                .map((r) => clampNumber(r.latency_ms))
                .filter((n) => Number.isFinite(n) && n >= 0);

            setRows(buildHistogram(samples, binSizeMs, maxMs));
            setLoading(false);
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [supabase, binSizeMs, maxMs]);

    const containerStyle: React.CSSProperties = {
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        height,
    };

    // no data states
    if (loading || !state) {
        return <LoadingMessageSpinner messages={["Loading metrics..."]} />
    }

    const apiKeys = state?.api_keys ?? [];
    if (apiKeys.length === 0) {
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
    } else if (!rows.length) {
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
                No latency data in the last 7 days
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 20, right: 16, bottom: 24, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis
                        dataKey="start"
                        tickFormatter={(v) => `${v} ms`}
                        minTickGap={36}
                        tick={{ fontSize: 12, fill: "var(--page-txt-2)" }}
                        tickLine={false}
                        axisLine={false}
                    />

                    <YAxis
                        width={32}
                        tick={{ fontSize: 12, fill: "var(--page-txt-2)" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />

                    <Tooltip
                        formatter={(value: number | string | undefined) => {
                            const n =
                                typeof value === "number"
                                    ? value
                                    : typeof value === "string"
                                        ? Number(value)
                                        : 0;
                            return [n.toLocaleString(), "Requests"] as const;
                        }}
                    />

                    <Bar
                        dataKey="count"
                        fill="var(--btn-1)"
                        radius={[6, 6, 0, 0]}
                        barSize={22}
                        isAnimationActive
                        animationDuration={900}
                        animationEasing="ease-out"
                    />

                    <text
                        x="50%"
                        y="100%"
                        dy={-6}
                        textAnchor="middle"
                        style={{ fontSize: 14, fill: "var(--page-txt-2)" }}
                    >
                        Response time (milliseconds)
                    </text>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
