"use client";

import React from "react";
import GenericAreaChart from "./GenericAreaChart";
import { createClient } from "@/utils/supabase/client";

type LatencyRpcRow = {
    day: string;
    avg_ms: number;
    p95_ms: number;
};

type LatencyChartRow = {
    name: string;
    avg_ms: number;
    p95_ms: number;
};

function formatMMDD(date: Date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function buildLast7DaysLatency(rows: LatencyRpcRow[]): LatencyChartRow[] {
    const map = new Map(rows.map((r) => [r.day, r]));

    const result: LatencyChartRow[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);

        const key = d.toISOString().slice(0, 10);
        const row = map.get(key);

        result.push({
            name: formatMMDD(d),
            avg_ms: row?.avg_ms ?? 0,
            p95_ms: row?.p95_ms ?? 0,
        });
    }
    return result;
}

export default function RecentLatencyChart() {
    const supabase = createClient();

    const [data, setData] = React.useState<LatencyChartRow[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const load = async () => {
            setLoading(true);

            const { data, error } = await supabase.rpc("get_api_latency_last_7_days");

            if (error) {
                console.error("Failed to load latency chart", error);
                setData([]);
                setLoading(false);
                return;
            }

            setData(buildLast7DaysLatency((data ?? []) as LatencyRpcRow[]));
            setLoading(false);
        };

        load();
    }, [supabase]);

    if (loading) {
        return (
            <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                Loading response times…
            </div>
        );
    }

    return (
        <GenericAreaChart
            data={data}
            xKey="name"
            series={[
                { key: "avg_ms", color: "#378afb", name: "Average Response Time (ms)" },
            ]}
            isAnimationActive
        />
    );
}
