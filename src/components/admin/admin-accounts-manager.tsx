'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, UserCog } from 'lucide-react'
import { createAdminAccountAction } from '@/app/actions/admin-auth'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

type AdminAccount = {
    id: string
    full_name: string
    email: string
    tag: string | null
    created_at: string
}

export function AdminAccountsManager({ initialAccounts }: { initialAccounts: AdminAccount[] }) {
    const [accounts, setAccounts] = useState(initialAccounts)
    const [showForm, setShowForm] = useState(false)
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [saving, setSaving] = useState(false)

    const handleCreate = async () => {
        if (!fullName.trim() || !email.trim() || password.length < 8) {
            toast.error('Full name, email, and an 8+ character password are required')
            return
        }
        setSaving(true)
        const result = await createAdminAccountAction({ email: email.trim(), password, fullName: fullName.trim() })
        setSaving(false)
        if (result.success) {
            toast.success('Admin account created')
            setFullName('')
            setEmail('')
            setPassword('')
            setShowForm(false)
            window.location.reload()
        } else {
            toast.error(result.error || 'Failed to create admin account')
        }
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {accounts.length === 0 ? (
                    <p className="text-sm text-gray-500">No individual admin accounts yet -- only the master key.</p>
                ) : (
                    accounts.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/40">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <UserCog className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{a.full_name}</p>
                                <p className="text-xs text-gray-400 truncate">{a.email} {a.tag && <span className="font-mono text-emerald-500">@{a.tag}</span>}</p>
                            </div>
                            <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                        </div>
                    ))
                )}
            </div>

            {showForm ? (
                <div className="space-y-3 p-3 rounded-lg bg-gray-700/40">
                    <div className="space-y-1">
                        <Label className="text-gray-400">Full Name</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-gray-900 border-gray-600 text-white" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-gray-400">Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-900 border-gray-600 text-white" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-gray-400">Temporary Password</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-900 border-gray-600 text-white" />
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreate} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                            Create
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                </div>
            ) : (
                <Button variant="outline" size="sm" className="w-full border-gray-600 text-gray-300 hover:text-white" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Admin Account
                </Button>
            )}
        </div>
    )
}
