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
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
    const [isSubcategoryView, setIsSubcategoryView] = useState(false)
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    // 1. Fetch Categories on Mount
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

    // 2. Filter Categories based on View Mode
    const availableCategories = useMemo(() => {
        if (isSubcategoryView) {
            // Show subcategories (has parent_id)
            // If a parent is selected, strictly show its children? 
            // For simplicity, let's just list ALL subcategories if "All" is selected, 
            // or filter by parent if we want complex logic.
            // Let's stick to: List all Subcategories.
            return categories.filter(c => c.parent_id !== null)
        } else {
            // Show Parent Categories
            return categories.filter(c => c.parent_id === null)
        }
    }, [categories, isSubcategoryView])

    // 3. Fetch Data when filters change
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedCategoryId || selectedCategoryId === 'all') {
                setSalesData([])
                return
            }

            setLoading(true)
            try {
                const { data, error } = await (supabase as any)
                    .rpc('get_sales_by_location', {
                        target_category_id: selectedCategoryId,
                        is_parent_category: !isSubcategoryView
                    })

                if (error) {
                    console.error('Analytics RPC error:', error)
                    // Fallback/Empty if error (e.g. RPC not created yet)
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
    }, [selectedCategoryId, isSubcategoryView])

    // Reset selection when toggling view mode
    const handleModeToggle = (checked: boolean) => {
        setIsSubcategoryView(checked)
        setSelectedCategoryId('all') // Reset to force user to pick
    }

    const hasData = salesData.length > 0

    return (
        <Card className="col-span-1 md:col-span-2 border-emerald-100 shadow-sm">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Sales by Location</CardTitle>
                        <CardDescription>
                            Where are your {isSubcategoryView ? 'subcategory' : 'category'} sales coming from?
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="mode-toggle"
                                checked={isSubcategoryView}
                                onCheckedChange={handleModeToggle}
                            />
                            <Label htmlFor="mode-toggle" className="text-sm font-medium cursor-pointer">
                                {isSubcategoryView ? 'Subcategories' : 'Main Categories'}
                            </Label>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Controls & List */}
                    <div className="w-full md:w-1/3 space-y-6">
                        <div className="space-y-2">
                            <Label>Select {isSubcategoryView ? 'Subcategory' : 'Category'}</Label>
                            <Select
                                value={selectedCategoryId}
                                onValueChange={setSelectedCategoryId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">-- Select to View --</SelectItem>
                                    {availableCategories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Stats List */}
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                            </div>
                        ) : hasData ? (
                            <div className="space-y-3">
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
                        ) : selectedCategoryId !== 'all' ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
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
