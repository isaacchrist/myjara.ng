import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { redirect } from "next/navigation"
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp } from "lucide-react"

export default async function BrandWalletPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect("/login")

    const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .single() as { data: { id: string } | null }

    if (!store) return redirect("/dashboard")

    const { data: transactions } = await supabase
        .from("transactions")
        .select(`
            *,
            orders(order_number)
        `)
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })

    const totalEarnings = transactions
        ?.filter((tx: any) => tx.status === 'success')
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0

    // No payouts table yet -- same known gap as /seller/wallet.
    const payouts = 0

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Wallet & Transactions</h1>
                <p className="text-gray-500">Track your earnings and payouts</p>
            </div>

            {/* Balance Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-emerald-900 text-white border-emerald-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Total Earnings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(totalEarnings)}</div>
                        <p className="text-xs text-emerald-300 mt-1">Lifetime store earnings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Pending Clearance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatPrice(0)}</div>
                        <p className="text-xs text-gray-500 mt-1">Funds being processed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4" />
                            Total Payouts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatPrice(payouts)}</div>
                        <p className="text-xs text-gray-500 mt-1">Withdrawn to bank</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Recent financial activity for your store</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions && transactions.length > 0 ? (
                                    transactions.map((tx: any) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-medium">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                                <div className="text-xs text-gray-500">
                                                    {new Date(tx.created_at).toLocaleTimeString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 rounded bg-emerald-100 text-emerald-600">
                                                        <ArrowDownLeft className="h-3 w-3" />
                                                    </div>
                                                    <span className="whitespace-nowrap">Order Payment</span>
                                                </div>
                                                {tx.orders && (
                                                    <p className="text-xs text-gray-500 ml-6 whitespace-nowrap">
                                                        Order #{tx.orders.order_number}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-gray-500">
                                                {tx.flutterwave_tx_id || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tx.status === 'success' ? 'default' : 'secondary'}
                                                    className={tx.status === 'success' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600">
                                                +{formatPrice(tx.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No transactions found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
