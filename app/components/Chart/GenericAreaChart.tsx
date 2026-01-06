import React from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

type AreaSeries<T> = {
    key: keyof T
    color: string
    name?: string
}

interface GenericAreaChartProps<T extends Record<string, string | number>> {
    data: T[]
    xKey: keyof T
    series: AreaSeries<T>[]
    height?: number
    showDevtools?: boolean
    isAnimationActive?: boolean
}

export default function GenericAreaChart<T extends Record<string, string | number>>({
    data,
    xKey,
    series,
    height = 380,
    showDevtools = false,
    isAnimationActive = true,
}: GenericAreaChartProps<T>) {
    return (
        <div style={{ width: "100%", minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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

                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={String(xKey)} tick={{ dy: 4 }} />
                    <YAxis tick={{ dx: -4 }} />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                    />
                    <Tooltip />

                    {series.map(({ key, color, name }, i) => (
                        <Area
                            key={String(key)}
                            dataKey={String(key)}
                            name={name ?? String(key)}
                            type="monotone"
                            stroke={color}
                            fill={`url(#gradient-${String(key)})`}
                            fillOpacity={1}
                            isAnimationActive={isAnimationActive}
                            animationBegin={i * 150}
                            animationDuration={900}
                            animationEasing="ease-in-out"
                        />
                    ))}

                    {showDevtools ? <RechartsDevtools /> : null}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}