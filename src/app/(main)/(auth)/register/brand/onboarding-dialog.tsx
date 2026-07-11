"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, ExternalLink, LayoutDashboard, Loader2 } from "lucide-react"
import { updateProfile } from "@/app/actions/profile"

const BRAND_COLORS = [
    { name: "Emerald", value: "#10b981" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Black", value: "#171717" },
]

export function BrandOnboardingDialog({
    open,
    slug,
    onDone,
}: {
    open: boolean
    slug: string
    onDone: () => void
}) {
    const [color, setColor] = useState(BRAND_COLORS[0].value)
    const [isSaving, setIsSaving] = useState(false)

    const handleFinish = async () => {
        setIsSaving(true)
        await updateProfile({ themeColor: color })
        setIsSaving(false)

        window.open(`/store/${slug}`, "_blank")
        window.open("/dashboard", "_blank")
        onDone()
    }

    return (
        <Dialog open={open}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <Sparkles className="h-6 w-6 text-emerald-600" />
                    </div>
                    <DialogTitle className="text-center">Welcome to MyJara!</DialogTitle>
                    <DialogDescription className="text-center">
                        Your wholesaler account is set up. Pick a brand color for your storefront — you can change it anytime in Settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap justify-center gap-3 py-2">
                    {BRAND_COLORS.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setColor(c.value)}
                            title={c.name}
                            className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 ${color === c.value ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                                }`}
                            style={{ backgroundColor: c.value }}
                        />
                    ))}
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button onClick={handleFinish} disabled={isSaving} className="w-full">
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <ExternalLink className="h-4 w-4 mr-2" />
                        )}
                        View My Store & Dashboard
                    </Button>
                    <Button variant="ghost" onClick={onDone} disabled={isSaving} className="w-full text-sm">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Skip for now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
