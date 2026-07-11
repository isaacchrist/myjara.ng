import { getAllPlansForAdminAction } from '@/app/actions/plans'
import { PricingManager } from '@/components/admin/pricing-manager'

export default async function AdminPricingPage() {
    const plans = await getAllPlansForAdminAction()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Subscription Pricing</h1>
                <p className="text-gray-400">Edit plan names, prices, and features per shop type. Changes apply the next time a store views the subscription page.</p>
            </div>

            <PricingManager initialPlans={plans} />
        </div>
    )
}
