import { SubscriptionManager } from "@/components/subscription/subscription-manager"

export default function DashboardSubscriptionPage() {
    return <SubscriptionManager backHref="/dashboard" onSuccessHref="/dashboard" />
}
