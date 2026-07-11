"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Globe, Trash2, CheckCircle2, Loader2 } from "lucide-react"
import {
    getStoreDomainsAction,
    addCustomDomainAction,
    verifyCustomDomainAction,
    removeCustomDomainAction,
} from "@/app/actions/domains"

type DomainRow = {
    id: string
    domain: string
    is_verified: boolean
    verification_token: string | null
}

export function CustomDomainCard() {
    const [domains, setDomains] = useState<DomainRow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newDomain, setNewDomain] = useState("")
    const [isAdding, setIsAdding] = useState(false)
    const [verifyingId, setVerifyingId] = useState<string | null>(null)
    const { toast } = useToast()

    const load = async () => {
        const result = await getStoreDomainsAction()
        if ("data" in result && result.data) setDomains(result.data as DomainRow[])
        setIsLoading(false)
    }

    useEffect(() => {
        load()
    }, [])

    const handleAdd = async () => {
        if (!newDomain.trim()) return
        setIsAdding(true)
        const result = await addCustomDomainAction(newDomain)
        setIsAdding(false)
        if ("error" in result) {
            toast({ title: "Could not add domain", description: result.error, variant: "destructive" })
            return
        }
        setNewDomain("")
        toast({ title: "Domain added", description: "Add the DNS records below, then verify." })
        load()
    }

    const handleVerify = async (id: string) => {
        setVerifyingId(id)
        const result = await verifyCustomDomainAction(id)
        setVerifyingId(null)
        if ("error" in result) {
            toast({ title: "Not verified yet", description: result.error, variant: "destructive" })
            return
        }
        toast({ title: "Domain verified", description: "Your storefront is now live on this domain." })
        load()
    }

    const handleRemove = async (id: string) => {
        const result = await removeCustomDomainAction(id)
        if (result && "error" in result) {
            toast({ title: "Could not remove domain", description: result.error, variant: "destructive" })
            return
        }
        load()
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-emerald-600" />
                    <div>
                        <CardTitle>Custom Domain</CardTitle>
                        <CardDescription>Connect your own domain (e.g. shop.yourbrand.com) to your storefront.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="shop.yourbrand.com"
                        disabled={isAdding}
                    />
                    <Button type="button" onClick={handleAdd} disabled={isAdding || !newDomain.trim()}>
                        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                </div>

                {!isLoading && domains.length === 0 && (
                    <p className="text-sm text-gray-500">No custom domain connected yet.</p>
                )}

                {domains.map((d) => (
                    <div key={d.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{d.domain}</span>
                                {d.is_verified ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 className="h-3 w-3" /> Verified
                                    </span>
                                ) : (
                                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                        Pending verification
                                    </span>
                                )}
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemove(d.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>

                        {!d.is_verified && (
                            <div className="text-sm text-gray-600 space-y-2 bg-gray-50 rounded-md p-3">
                                <p>
                                    1. Point your domain&apos;s DNS to Vercel: add a <strong>CNAME</strong> record for{" "}
                                    <code className="bg-white border rounded px-1">{d.domain}</code> targeting{" "}
                                    <code className="bg-white border rounded px-1">cname.vercel-dns.com</code> (use an{" "}
                                    <strong>A</strong> record to <code className="bg-white border rounded px-1">76.76.21.21</code>{" "}
                                    instead if it&apos;s a root/apex domain).
                                </p>
                                <p>
                                    2. Prove ownership by adding a <strong>TXT</strong> record at{" "}
                                    <code className="bg-white border rounded px-1">_myjara-verify.{d.domain}</code> with value:
                                </p>
                                <code className="block bg-white border rounded px-2 py-1 text-xs break-all">
                                    myjara-verify={d.verification_token}
                                </code>
                                <p>3. Once both records are live (DNS changes can take a few hours), click Verify.</p>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleVerify(d.id)}
                                    disabled={verifyingId === d.id}
                                >
                                    {verifyingId === d.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                    Verify domain
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
