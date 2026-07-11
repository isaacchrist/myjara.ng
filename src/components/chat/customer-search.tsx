'use client'

import { useState, useEffect } from 'react'
import { searchUsersAction } from '@/app/actions/chat'
import { Input } from '@/components/ui/input'
import { Loader2, Search, PlusCircle, User } from 'lucide-react'

interface CustomerSearchProps {
    onSelect: (userId: string) => void
    excludeIds?: string[]
    isStarting?: boolean
    placeholder?: string
}

// Store-side "find someone new to chat with" -- searches all users by
// name/email/tag (searchUsersAction), independent of any existing chat_rooms.
export function CustomerSearch({ onSelect, excludeIds = [], isStarting, placeholder }: CustomerSearchProps) {
    const [term, setTerm] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (term.trim().length < 2) {
            setResults([])
            return
        }
        setLoading(true)
        const timeoutId = setTimeout(async () => {
            const data = await searchUsersAction(term)
            setResults(data)
            setLoading(false)
        }, 400)
        return () => clearTimeout(timeoutId)
    }, [term])

    const filteredResults = results.filter(u => !excludeIds.includes(u.id))

    return (
        <div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                    placeholder={placeholder || 'Find someone by name, tag, or email...'}
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            {term.trim().length >= 2 && (
                <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border divide-y">
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                    ) : filteredResults.length > 0 ? (
                        filteredResults.map((u: any) => (
                            <button
                                key={u.id}
                                type="button"
                                disabled={isStarting}
                                onClick={() => onSelect(u.id)}
                                className="flex w-full items-center gap-3 p-3 text-left hover:bg-emerald-50 disabled:opacity-50"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900">{u.full_name || u.email}</p>
                                    <p className="truncate text-xs text-gray-500">@{u.tag || 'no-tag'}</p>
                                </div>
                                <PlusCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                            </button>
                        ))
                    ) : (
                        <div className="py-4 text-center text-sm text-gray-400">
                            No users found matching &quot;{term}&quot;
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
