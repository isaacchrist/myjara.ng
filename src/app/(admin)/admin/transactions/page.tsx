import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { CreditCard, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default async function AdminTransactionsPage() {
    const supabase = await createAdminClient()

    // Fetch real payment transactions (recorded by payment-button.tsx on a
    // successful Flutterwave callback -- one row per gateway payment, not
    // one per order). This previously queried `orders` with `total_amount`/
    // `buyer_id`, neither of which exist (real columns are `total`/
    // `user_id`), and compared `status` against 'completed', which isn't a
    // valid order_status either -- the query always errored, so this page
    // always rendered "No transactions found" with all-zero stats.
    const { data: transactionsData } = await supabase
        .from('transactions')
        .select('id, order_id, amount, status, created_at, order:orders(order_number), store:stores(name)')
        .order('created_at', { ascending: false })
        .limit(50) as any

    const transactions = transactionsData || []

    // Calculate stats. transaction_status enum is pending|success|failed.
    const totalAmount = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
    const successCount = transactions.filter((t: any) => t.status === 'success').length
    const pendingCount = transactions.filter((t: any) => t.status === 'pending').length

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        failed: 'bg-red-500/20 text-red-400 border-red-500/30',
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
                            <p className="text-2xl font-bold text-white">{successCount}</p>
                            <p className="text-sm text-gray-400">Successful</p>
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
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Order</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Store</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx: any) => (
                                    <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                        <td className="py-3 px-4 text-white font-mono text-xs">{tx.order?.order_number || tx.order_id.slice(0, 8)}</td>
                                        <td className="py-3 px-4 text-gray-300">{tx.store?.name || 'Unknown Store'}</td>
                                        <td className="py-3 px-4 text-white font-medium">{formatPrice(tx.amount)}</td>
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
                                        <td colSpan={5} className="py-8 text-center text-gray-500">
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
