
'use client'

import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import Papa from 'papaparse'

// Types based on the DB views
interface MemberStats {
    organization_id: string
    total_members: number
    age_0_5: number
    age_6_12: number
    age_13_19: number
    age_20_25: number
    age_26_plus: number
    age_unknown: number
}

interface MemberGrowth {
    month: string
    new_members: number
}

interface ReportingDashboardProps {
    stats: MemberStats | null
    growth: MemberGrowth[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function ReportingDashboardClient({ stats, growth }: ReportingDashboardProps) {
    if (!stats) return <div>Ingen data tilgjengelig for rapportering.</div>

    // Transform stats for charts
    const ageData = [
        { name: '0-5 år', value: stats.age_0_5 },
        { name: '6-12 år', value: stats.age_6_12 },
        { name: '13-19 år', value: stats.age_13_19 },
        { name: '20-25 år', value: stats.age_20_25 },
        { name: '26+ år', value: stats.age_26_plus },
        { name: 'Ukjent', value: stats.age_unknown },
    ].filter(d => d.value > 0)

    const handleDownloadCSV = () => {
        const csvData = [
            ['Kategori', 'Antall'],
            ...ageData.map(d => [d.name, d.value]),
            ['Totalt', stats.total_members]
        ]
        const csv = Papa.unparse(csvData)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'medlemsstatistikk.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Rapportering & Statistikk</h2>
                <Button onClick={handleDownloadCSV} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Last ned CSV (NIF)
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="md:col-span-1 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Aldersfordeling</CardTitle>
                        <CardDescription>
                            Aktive medlemmer fordelt på aldersgrupper (NIF standard).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={ageData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name="Antall medlemmer" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="md:col-span-1 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Kakediagram</CardTitle>
                        <CardDescription>
                            Visuell fordeling av medlemsmassen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={ageData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {ageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Medlemsvekst (Siste 12 mnd)</CardTitle>
                    <CardDescription>
                        Nye medlemmer registrert per måned.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={growth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="new_members" name="Nye medlemmer" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
