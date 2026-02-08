"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts"

const dataActivity = [
    { name: 'Mon', tests: 4 },
    { name: 'Tue', tests: 7 },
    { name: 'Wed', tests: 3 },
    { name: 'Thu', tests: 8 },
    { name: 'Fri', tests: 5 },
    { name: 'Sat', tests: 2 },
    { name: 'Sun', tests: 6 },
]

const dataPerformance = [
    { name: 'Passed', value: 85 },
    { name: 'Failed', value: 15 },
]

const COLORS = ['#22c55e', '#ef4444'];

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 min-h-screen p-8">
                <header className="mb-8">
                    <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
                    <p className="text-sm text-muted-foreground">Performance metrics and usage insights</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Activity Chart */}
                    <div className="bg-card p-6 rounded-xl border border-border">
                        <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataActivity}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    />
                                    <Bar dataKey="tests" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Performance Pie Chart */}
                    <div className="bg-card p-6 rounded-xl border border-border">
                        <h3 className="text-lg font-semibold mb-4">Test Performance</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dataPerformance}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {dataPerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
