'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tag, Plus, Pencil, Trash2, Loader2, X, Check, EyeOff } from 'lucide-react'
import { upsertPlanAction, deletePlanAction, type SubscriptionPlan } from '@/app/actions/plans'
import { toast } from 'sonner'

const SHOP_TYPES: { key: SubscriptionPlan['shop_type']; label: string }[] = [
    { key: 'physical', label: 'Physical Retailers' },
    { key: 'online', label: 'Online Retailers' },
    { key: 'market_day', label: 'Market-Day Sellers' },
    { key: 'brand', label: 'Wholesalers / Brands' },
]

function featuresToText(features: string[]) {
    return (features || []).join('\n')
}

function textToFeatures(text: string) {
    return text.split('\n').map((f) => f.trim()).filter(Boolean)
}

function PlanForm({
    shopType,
    plan,
    onDone,
}: {
    shopType: SubscriptionPlan['shop_type']
    plan?: SubscriptionPlan
    onDone: () => void
}) {
    const [planKey, setPlanKey] = useState(plan?.plan_key || '')
    const [name, setName] = useState(plan?.name || '')
    const [price, setPrice] = useState(String(plan?.price ?? 0))
    const [features, setFeatures] = useState(featuresToText(plan?.features || []))
    const [sortOrder, setSortOrder] = useState(String(plan?.sort_order ?? 0))
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!planKey.trim() || !name.trim()) {
            toast.error('Plan key and name are required')
            return
        }
        setSaving(true)
        const result = await upsertPlanAction({
            id: plan?.id,
            shop_type: shopType,
            plan_key: planKey.trim(),
            name: name.trim(),
            price: Number(price) || 0,
            features: textToFeatures(features),
            sort_order: Number(sortOrder) || 0,
            is_active: plan?.is_active ?? true,
        })
        setSaving(false)
        if (result.success) {
            toast.success(plan ? 'Plan updated' : 'Plan created')
            onDone()
        } else {
            toast.error(result.error || 'Failed to save plan')
        }
    }

    return (
        <div className="p-4 bg-gray-850 border border-gray-700 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-gray-500">Plan key (stable, e.g. "pro")</label>
                    <Input
                        value={planKey}
                        onChange={(e) => setPlanKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                        disabled={!!plan}
                        className="bg-gray-900 border-gray-700 text-white"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Display name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-900 border-gray-700 text-white" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Price (₦/mo)</label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-gray-900 border-gray-700 text-white" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Sort order</label>
                    <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-gray-900 border-gray-700 text-white" />
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-500">Features (one per line)</label>
                <Textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={4} className="bg-gray-900 border-gray-700 text-white" />
            </div>
            <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                    Save
                </Button>
                <Button size="sm" variant="ghost" onClick={onDone}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
            </div>
        </div>
    )
}

function PlanRow({ plan, onChanged }: { plan: SubscriptionPlan; onChanged: () => void }) {
    const [editing, setEditing] = useState(false)
    const [busy, setBusy] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`Delete "${plan.name}"? Stores currently on this plan keep their access until it expires, but won't be able to renew into it.`)) return
        setBusy(true)
        const result = await deletePlanAction(plan.id)
        setBusy(false)
        if (result.success) {
            toast.success('Plan deleted')
            onChanged()
        } else {
            toast.error(result.error || 'Failed to delete plan')
        }
    }

    const handleToggleActive = async () => {
        setBusy(true)
        const result = await upsertPlanAction({ ...plan, is_active: !plan.is_active })
        setBusy(false)
        if (result.success) {
            toast.success(plan.is_active ? 'Plan hidden' : 'Plan activated')
            onChanged()
        } else {
            toast.error(result.error || 'Failed to update plan')
        }
    }

    if (editing) {
        return <PlanForm shopType={plan.shop_type} plan={plan} onDone={() => { setEditing(false); onChanged() }} />
    }

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg bg-gray-750 hover:bg-gray-700 transition-colors group ${!plan.is_active ? 'opacity-50' : ''}`}>
            <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Tag className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                    {plan.name} <span className="text-gray-500 font-normal">({plan.plan_key})</span>
                    {!plan.is_active && <span className="ml-2 text-xs text-amber-400">Hidden</span>}
                </p>
                <p className="text-xs text-gray-400">₦{plan.price.toLocaleString()}/mo &middot; {plan.features.length} feature{plan.features.length === 1 ? '' : 's'}</p>
            </div>
            <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-white" onClick={handleToggleActive} disabled={busy} title={plan.is_active ? 'Hide plan' : 'Activate plan'}>
                    <EyeOff className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-white" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-400" onClick={handleDelete} disabled={busy}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
            </span>
        </div>
    )
}

export function PricingManager({ initialPlans }: { initialPlans: SubscriptionPlan[] }) {
    const [addingTo, setAddingTo] = useState<SubscriptionPlan['shop_type'] | null>(null)

    // Server actions revalidate the page path; simplest correct way to reflect
    // that in this client-held copy of the list is a full route refresh,
    // matching the pattern already used by CategoriesManager.
    const onChanged = () => {
        setAddingTo(null)
        window.location.reload()
    }

    return (
        <div className="space-y-6">
            {SHOP_TYPES.map(({ key, label }) => {
                const plansForType = initialPlans.filter((p) => p.shop_type === key).sort((a, b) => a.sort_order - b.sort_order)
                return (
                    <Card key={key} className="bg-gray-800 border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-white">{label}</CardTitle>
                                <CardDescription className="text-gray-400">{plansForType.length} plan{plansForType.length === 1 ? '' : 's'}</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setAddingTo(key)}>
                                <Plus className="h-4 w-4 mr-1" /> Add Plan
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {addingTo === key && <PlanForm shopType={key} onDone={onChanged} />}
                            {plansForType.map((plan) => (
                                <PlanRow key={plan.id} plan={plan} onChanged={onChanged} />
                            ))}
                            {plansForType.length === 0 && addingTo !== key && (
                                <div className="text-center text-gray-500 py-8">No plans yet for this shop type.</div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
