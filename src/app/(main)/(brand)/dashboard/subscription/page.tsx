'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Crown, AlertCircle, Clock, CheckCircle2, CreditCard } from 'lucide-react'
import { formatDistanceToNow, format, differenceInDays } from 'date-fns'

type Subscription = {
    id: string
    plan_type: 'basic' | 'pro' | 'exclusive'
    status: 'active' | 'expired' | 'cancelled'
    start_date: string
    end_date: string
    payment_reference: string | null
}

const PLAN_DETAILS: Record<string, { name: string; color: string; icon: any; features: string[] }> = {
    basic: {
        name: 'Basic Plan',
        color: 'bg-gray-100 text-gray-700',
        icon: CheckCircle2,
        features: [
            'Up to 10 product listings',
            'Basic analytics',
            'Customer messaging',
            'Standard support',
        ]
    },
    pro: {
        name: 'Pro Plan',
        color: 'bg-blue-100 text-blue-700',
        icon: Crown,
        features: [
            'Up to 100 product listings',
            'Advanced analytics',
            'Priority customer matching',
            'Logistics integration',
            'Priority support',
        ]
    },
    exclusive: {
        name: 'Exclusive Plan',
        color: 'bg-purple-100 text-purple-700',
        icon: Crown,
        features: [
            'Unlimited product listings',
            'Full analytics suite',
            'Featured placement',
            'Dedicated account manager',
            'Wholesaler access',
            '24/7 premium support',
        ]
    }
}

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchSubscription = async () => {
            const supabase = createClient()

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setUser(user)

            // Fetch subscription
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setSubscription(data as Subscription)
            }
            setLoading(false)
        }

        fetchSubscription()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!subscription) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card className="text-center py-12">
                    <CardContent>
                        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Subscription</h2>
                        <p className="text-gray-500 mb-6">You don't have an active subscription yet.</p>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            View Plans
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const planInfo = PLAN_DETAILS[subscription.plan_type] || PLAN_DETAILS.basic
    const PlanIcon = planInfo.icon
    const daysRemaining = differenceInDays(new Date(subscription.end_date), new Date())
    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7
    const isExpired = subscription.status === 'expired' || daysRemaining < 0

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-8 w-8 text-emerald-600" />
                    Subscription
                </h1>
                <p className="text-gray-500 mt-1">Manage your subscription and billing</p>
            </div>

            {/* Alert if expiring soon */}
            {isExpiringSoon && !isExpired && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="flex items-center gap-4 p-4">
                        <AlertCircle className="h-6 w-6 text-orange-500" />
                        <div>
                            <p className="font-semibold text-orange-800">Your subscription expires in {daysRemaining} days</p>
                            <p className="text-sm text-orange-600">Renew now to avoid service interruption.</p>
                        </div>
                        <Button className="ml-auto bg-orange-500 hover:bg-orange-600">
                            Renew Now
                        </Button>
                    </CardContent>
                </Card>
            )}

            {isExpired && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-4 p-4">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                        <div>
                            <p className="font-semibold text-red-800">Your subscription has expired</p>
                            <p className="text-sm text-red-600">Renew to continue listing products and accessing premium features.</p>
                        </div>
                        <Button className="ml-auto bg-red-500 hover:bg-red-600">
                            Renew Now
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Current Plan */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Current Plan</span>
                        <Badge className={planInfo.color}>
                            <PlanIcon className="h-3.5 w-3.5 mr-1" />
                            {planInfo.name}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Plan Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Status</p>
                            <Badge
                                className={
                                    isExpired
                                        ? 'bg-red-100 text-red-700 mt-1'
                                        : 'bg-green-100 text-green-700 mt-1'
                                }
                            >
                                {isExpired ? 'Expired' : 'Active'}
                            </Badge>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Started</p>
                            <p className="font-semibold">{format(new Date(subscription.start_date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Expires</p>
                            <p className="font-semibold">{format(new Date(subscription.end_date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Time Remaining</p>
                            <p className="font-semibold">
                                {isExpired ? 'Expired' : `${daysRemaining} days`}
                            </p>
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Plan Features</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {planInfo.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" className="flex-1">
                            Change Plan
                        </Button>
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                            Renew Subscription
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-500" />
                        Payment History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-400">
                        <p>Payment history will be available soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
