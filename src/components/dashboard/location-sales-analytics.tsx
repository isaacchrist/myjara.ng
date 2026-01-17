'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { Loader2, RefreshCcw } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Category {
    id: string
    name: string
    parent_id: string | null
}

interface LocationSales {
    location_name: string
    total_sales: number
    order_count: number
}

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1']

export function LocationSalesAnalytics() {
    const [categories, setCategories] = useState<Category[]>([])
    const [salesData, setSalesData] = useState<LocationSales[]>([])

    // Controls
    const [selectedParentId, setSelectedParentId] = useState<string>('all')
    const [selectedSubId, setSelectedSubId] = useState<string>('all')
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    // 1. Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('categories')
                .select('id, name, parent_id')
                .order('name')

            if (data) {
                setCategories(data as Category[])
            }
        }
        fetchCategories()
    }, [])

    // 2. Computed Lists
    const parentCategories = useMemo(() =>
        categories.filter(c => c.parent_id === null),
        [categories])

    const subCategories = useMemo(() => {
        if (selectedParentId === 'all') return []
        return categories.filter(c => c.parent_id === selectedParentId)
    }, [categories, selectedParentId])

    // 3. Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            // Determine what to filter by
            // If nothing selected, maybe show global? Or wait?
            // Let's show Global if 'all' & 'all', but existing RPC requires an ID if we use that logic.
            // If RPC requires ID, we might need a 'global' mode or pass null?
            // Checking RPC: "target_category_id uuid". UUID cannot be null if not handled?
            // If I pass a specific Parents ID, it works.
            // If I want "All Sales", user has to pick something?
            // User asked "Sales by Location per Category". So picking a category is expected.

            let targetId = selectedSubId !== 'all' ? selectedSubId : selectedParentId
            let isParent = selectedSubId === 'all'

            if (targetId === 'all') {
                setSalesData([])
                return
            }

            setLoading(true)
            try {
                const { data, error } = await (supabase as any)
                    .rpc('get_sales_by_location', {
                        target_category_id: targetId,
                        is_parent_category: isParent
                    })

                if (error) {
                    console.error('Analytics RPC error:', error)
                    setSalesData([])
                } else {
                    setSalesData(data || [])
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [selectedParentId, selectedSubId])

    // Reset sub when parent changes
    const handleParentChange = (val: string) => {
        setSelectedParentId(val)
        setSelectedSubId('all')
    }

    const hasData = salesData.length > 0

    return (
        <Card className="col-span-1 md:col-span-2 border-emerald-100 shadow-sm">
            <CardHeader>
                <CardTitle>Sales by Location</CardTitle>
                <CardDescription>
                    Drill down by category to see sales distribution across cities.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Controls & List */}
                    <div className="w-full md:w-1/3 space-y-6">
                        {/* Filters */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Main Category</Label>
                                <Select value={selectedParentId} onValueChange={handleParentChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">-- Select Category --</SelectItem>
                                        {parentCategories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className={selectedParentId === 'all' ? 'text-gray-400' : ''}>Subcategory (Optional)</Label>
                                <Select
                                    value={selectedSubId}
                                    onValueChange={setSelectedSubId}
                                    disabled={selectedParentId === 'all' || subCategories.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={subCategories.length === 0 && selectedParentId !== 'all' ? "No subcategories" : "All Subcategories"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Subcategories</SelectItem>
                                        {subCategories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Stats List */}
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                            </div>
                        ) : hasData ? (
                            <div className="space-y-3 pt-4 border-t border-dashed">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Top Locations</h4>
                                {salesData.slice(0, 5).map((item, index) => (
                                    <div key={item.location_name} className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="font-medium text-gray-700">{item.location_name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{formatPrice(item.total_sales)}</div>
                                            <div className="text-xs text-gray-500">{item.order_count} orders</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : selectedParentId !== 'all' ? (
                            <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                                No sales data found for this selection.
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm italic">
                                Please select a category to view analysis.
                            </div>
                        )}
                    </div>

                    {/* Chart */}
                    <div className="w-full md:w-2/3 h-[300px] flex items-center justify-center bg-white rounded-xl border border-dashed border-gray-200">
                        {loading ? (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="text-sm">Analyzing data...</span>
                            </div>
                        ) : hasData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={salesData as any}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="total_sales"
                                        nameKey="location_name"
                                    >
                                        {salesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => formatPrice(value || 0)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-300">
                                <RefreshCcw className="h-10 w-10" />
                                <span>No Data to Display</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
