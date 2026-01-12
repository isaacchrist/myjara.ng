import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HelpCircle, FileText, Truck, CreditCard, ShieldCheck } from "lucide-react"

export default function PublicHelpPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help you?</h1>
                <p className="text-lg text-gray-600">Browse our topics or sign in to submit a support ticket.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-emerald-100">
                    <CardHeader>
                        <Truck className="h-10 w-10 text-emerald-600 mb-2" />
                        <CardTitle>Delivery & Logistics</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-500">
                        Track your order, shipping rates, and delivery times for Abuja markets.
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-emerald-100">
                    <CardHeader>
                        <CreditCard className="h-10 w-10 text-emerald-600 mb-2" />
                        <CardTitle>Payments</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-500">
                        Secure payments via Flutterwave, refunds, and escrow protection.
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-emerald-100">
                    <CardHeader>
                        <ShieldCheck className="h-10 w-10 text-emerald-600 mb-2" />
                        <CardTitle>Buyer Protection</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-500">
                        How we ensure product quality and what to do if you have an issue.
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-emerald-100">
                    <CardHeader>
                        <FileText className="h-10 w-10 text-emerald-600 mb-2" />
                        <CardTitle>Selling on MyJara</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-500">
                        Guides for Wholesalers and Retailers on managing their inventory.
                    </CardContent>
                </Card>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-8 md:p-12 text-center">
                <HelpCircle className="h-12 w-12 text-emerald-700 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-emerald-900 mb-2">Need Personalized Support?</h2>
                <p className="text-emerald-700 mb-8 max-w-2xl mx-auto">
                    If you have an issue with an existing order or need operational assistance, submit a ticket through your dashboard.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/dashboard/help">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8">
                            Open Dashboard Ticket
                        </Button>
                    </Link>
                    <Link href="/contact">
                        <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 h-11 px-8">
                            Contact Us
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
