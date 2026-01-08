"use client";

import { RechartsDevtools } from "@recharts/devtools";
import React from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
} from "recharts";

type AreaSeries<T> = {
    key: keyof T;
    color: string;
    name?: string;
};

interface GenericAreaChartProps<T extends Record<string, string | number>> {
    data: T[];
    xKey: keyof T;
    series: AreaSeries<T>[];
    height?: number | string;
    showDevtools?: boolean;
    isAnimationActive?: boolean;
}

export default function GenericAreaChart<T extends Record<string, string | number>>({
    data,
    xKey,
    series,
    height = 325,
    showDevtools = false,
    isAnimationActive = true,
}: GenericAreaChartProps<T>) {
    return (
        <div style={{ width: "100%", height, minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 16, bottom: 10, left: 0 }}
                >
                    <defs>
                        {series.map(({ key, color }) => (
                            <linearGradient
                                key={String(key)}
                                id={`gradient-${String(key)}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.2} />
                            </linearGradient>
                        ))}
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis
                        dataKey={String(xKey)}
                        tick={{ fontSize: 12, fill: "var(--page-txt-2)" }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                        tickMargin={8}
                    />

                    <YAxis
                        width={34}
                        tick={{ fontSize: 12, fill: "var(--page-txt-2)" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />

                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{
                            fontSize: 14,
                            color: "var(--page-txt-1)",
                        }}
                        formatter={(value) => (
                            <span style={{ color: "var(--page-txt-1)", fontSize: 14 }}>
                                {value}
                            </span>
                        )}
                    />


                    <Tooltip />

                    {series.map(({ key, color, name }) => (
                        <Area
                            key={String(key)}
                            dataKey={String(key)}
                            name={name ?? String(key)}
                            type="monotone"
                            stroke={color}
                            fill={`url(#gradient-${String(key)})`}
                            fillOpacity={1}
                            isAnimationActive={isAnimationActive}
                            animationBegin={0}
                            animationDuration={900}
                            animationEasing="ease-out"
                        />
                    ))}

                    {showDevtools ? <RechartsDevtools /> : null}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
