'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Lightbulb, Send } from 'lucide-react'

export default function RecommendFeaturePage() {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('feature')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('You must be logged in to submit a recommendation')
            setSubmitting(false)
            return
        }

        const { error } = await supabase.from('feature_recommendations').insert({
            user_id: user.id,
            title,
            description,
            type,
            status: 'pending'
        })

        setSubmitting(false)

        if (error) {
            console.error(error)
            toast.error('Failed to submit recommendation')
        } else {
            setSubmitted(true)
            toast.success('Recommendation submitted successfully!')
        }
    }

    if (submitted) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 bg-emerald-50 border-emerald-200">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <Lightbulb className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-900 mb-2">Thank You!</h2>
                    <p className="text-emerald-700 mb-6">
                        Your recommendation has been submitted. Our team will review it shortly.
                    </p>
                    <Button onClick={() => {
                        setSubmitted(false)
                        setTitle('')
                        setDescription('')
                    }} className="bg-emerald-600 hover:bg-emerald-700">
                        Submit Another
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-12">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Lightbulb className="h-6 w-6 text-yellow-500" />
                        Recommend a Feature
                    </CardTitle>
                    <CardDescription>
                        Have a great idea? Want a new category? Let us know how we can make MyJara better for you.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Recommendation Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="feature">New Feature</SelectItem>
                                    <SelectItem value="category">New Category</SelectItem>
                                    <SelectItem value="improvement">Improvement</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g. Add specific electronics category"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Describe your idea in detail..."
                                className="min-h-[150px]"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Recommendation'}
                            <Send className="ml-2 h-4 w-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
