"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useUser } from "@/app/context/UserProvider";
import { createClient } from "@/utils/supabase/client";

import GenericAreaChart from "./GenericAreaChart";
import { ButtonOne } from "../Buttons/Buttons";
import LoadingMessageSpinner from "../LoadingMessageSpinner/LoadingMessageSpinner";


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
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    const { state } = useUser();
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

    const containerStyle: React.CSSProperties = {
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        height,
    };

    // no data states
    const apiKeys = state?.api_keys ?? [];

    if (loading || !state) {
        return <LoadingMessageSpinner messages={["Loading metrics..."]} />
    }

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
    }

    return (
        <GenericAreaChart
            data={chartData}
            xKey="name"
            series={[
                { key: "success", color: "var(--success-color)", name: "Successful Requests" },
                { key: "failed", color: "var(--fail-color)", name: "Failed Requests" },
            ]}
            height={height}
        />
    );
}
