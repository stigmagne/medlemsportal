'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useTranslations } from 'next-intl'

interface PaymentStatusChartProps {
    data: {
        name: string
        value: number
        color: string
    }[]
}

export default function PaymentStatusChart({ data }: PaymentStatusChartProps) {
    const t = useTranslations('Analytics')
    const total = data.reduce((acc, curr) => acc + curr.value, 0)

    if (total === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-gray-400">
                Ingen betalingsdata tilgjengelig
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                        formatter={(value) => {
                            if (value === 'Betalt') return t('paymentStatus.paid')
                            if (value === 'Venter') return t('paymentStatus.pending')
                            if (value === 'Feilet') return t('paymentStatus.failed')
                            return value
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
