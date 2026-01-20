import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { CreditCard, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default async function AdminTransactionsPage() {
    const supabase = await createAdminClient()

    // Fetch all orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, buyer_id')
        .order('created_at', { ascending: false })
        .limit(50) as any

    const transactions = orders || []

    // Calculate stats
    const totalAmount = transactions.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0)
    const completedCount = transactions.filter((t: any) => t.status === 'completed').length
    const pendingCount = transactions.filter((t: any) => t.status === 'pending').length

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        processing: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Transactions</h1>
                <p className="text-gray-400">Platform-wide transaction history</p>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                            <CreditCard className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{transactions.length}</p>
                            <p className="text-sm text-gray-400">Total Transactions</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{formatPrice(totalAmount)}</p>
                            <p className="text-sm text-gray-400">Total Volume</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{completedCount}</p>
                            <p className="text-sm text-gray-400">Completed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-lg">
                            <Clock className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{pendingCount}</p>
                            <p className="text-sm text-gray-400">Pending</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Recent Transactions</CardTitle>
                    <CardDescription className="text-gray-400">All platform transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Order ID</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx: any) => (
                                    <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                        <td className="py-3 px-4 text-white font-mono text-xs">{tx.id.slice(0, 8)}...</td>
                                        <td className="py-3 px-4 text-white font-medium">{formatPrice(tx.total_amount)}</td>
                                        <td className="py-3 px-4">
                                            <Badge className={statusColors[tx.status] || statusColors.pending}>
                                                {tx.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-gray-400">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-500">
                                            No transactions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
