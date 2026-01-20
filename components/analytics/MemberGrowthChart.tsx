'use client'

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { useTranslations } from 'next-intl'

interface MemberGrowthChartProps {
    data: {
        date: string
        count: number
    }[]
}

export default function MemberGrowthChart({ data }: MemberGrowthChartProps) {
    const t = useTranslations('Analytics')
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        fontSize={12}
                        tickMargin={10}
                    />
                    <YAxis
                        fontSize={12}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#2563eb"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        name={t('tooltips.members')}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
