'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Pie, PieChart, Cell } from 'recharts'
import { formatPrice } from '@/lib/utils'

interface ChartData {
    date: string
    revenue: number
    orders: number
}

interface DemographicData {
    name: string
    value: number
    [key: string]: string | number // Index signature for Recharts compatibility
}

interface AnalyticsChartsProps {
    data: ChartData[]
    usersByRole?: DemographicData[]
    usersByLocation?: DemographicData[]
}

// Color palette for pie charts
const ROLE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
const LOCATION_COLORS = ['#06b6d4', '#14b8a6', '#22c55e', '#84cc16', '#eab308', '#f97316']

// Mock data (will be replaced with real data from backend)
const MOCK_USERS_BY_ROLE: DemographicData[] = [
    { name: 'Retailers', value: 245 },
    { name: 'Wholesalers', value: 89 },
    { name: 'Customers', value: 1230 },
    { name: 'Admins', value: 5 },
]

const MOCK_USERS_BY_LOCATION: DemographicData[] = [
    { name: 'AMAC', value: 580 },
    { name: 'Bwari', value: 320 },
    { name: 'Gwagwalada', value: 180 },
    { name: 'Kuje', value: 150 },
    { name: 'Abaji', value: 120 },
    { name: 'Kwali', value: 80 },
]

export function OverviewCharts({ data, usersByRole, usersByLocation }: AnalyticsChartsProps) {
    const roleData = usersByRole || MOCK_USERS_BY_ROLE
    const locationData = usersByLocation || MOCK_USERS_BY_LOCATION

    return (
        <div className="space-y-6">
            {/* Original Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Over Time</CardTitle>
                        <CardDescription>Daily revenue for the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₦${value}`}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => formatPrice(value)}
                                        labelClassName="text-gray-900 font-bold"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#059669"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Orders Volume</CardTitle>
                        <CardDescription>Number of orders per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        labelClassName="text-gray-900 font-bold"
                                    />
                                    <Bar
                                        dataKey="orders"
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Demographics Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>User Base by Role</CardTitle>
                        <CardDescription>Distribution of users across roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roleData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {roleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => value.toLocaleString()} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>User Base by Location</CardTitle>
                        <CardDescription>Distribution of users across Abuja LGAs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={locationData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {locationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={LOCATION_COLORS[index % LOCATION_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => value.toLocaleString()} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

