"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/utils/supabase/client";

import GenericAreaChart from "./GenericAreaChart";

type ApiLogChartRow = {
    name: string;
    success: number;
    failed: number;
};

// helpers
function formatMMDD(date: Date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function buildLast7DaysSeries(rows: {
    day: string;
    success: number;
    failed: number;
}[]) {
    const map = new Map(rows.map((r) => [r.day, r]));

    const result: ApiLogChartRow[] = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);

        const key = d.toISOString().slice(0, 10);
        const row = map.get(key);

        result.push({
            name: formatMMDD(d),
            success: row?.success ?? 0,
            failed: row?.failed ?? 0,
        });
    }

    return result;
}

export default function RecentActivityChart({ height = "100%" }: { height?: number | string }) {
    const supabase = createClient();

    const [chartData, setChartData] = useState<ApiLogChartRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadChartData = async () => {
            setLoading(true);

            const { data, error } = await supabase.rpc(
                "get_api_log_counts_last_7_days"
            );

            if (error) {
                console.error("Failed to load API log chart data", error);
                setLoading(false);
                return;
            }

            setChartData(buildLast7DaysSeries(data ?? []));
            setLoading(false);
        };

        loadChartData();
    }, [supabase]);

    if (loading) {
        return (
            <div className="h-[380px] flex items-center justify-center text-gray-500">
                Loading request activity…
            </div>
        );
    }

    return (
        <GenericAreaChart
            data={chartData}
            xKey="name"
            series={[
                { key: "success", color: "#82ca9d", name: "Successful Requests" },
                { key: "failed", color: "#F87777", name: "Failed Requests" },
            ]}
            height={height}
        />
    );
}
