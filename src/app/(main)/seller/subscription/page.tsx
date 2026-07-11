import { SubscriptionManager } from "@/components/subscription/subscription-manager"

export default function SellerSubscriptionPage() {
    return <SubscriptionManager backHref="/seller/dashboard" onSuccessHref="/seller/dashboard" />
}
