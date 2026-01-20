import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default async function AdminRecommendationsPage() {
    const supabase = await createClient()

    // Protected Route
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    // Check Admin Role
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single() as any
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
        return redirect('/')
    }

    const { data: recommendations } = await supabase
        .from('feature_recommendations')
        .select(`
            *,
            user:users(full_name, email, role)
        `)
        .order('created_at', { ascending: false })

    const statusColors: any = {
        pending: 'bg-yellow-100 text-yellow-800',
        reviewed: 'bg-emerald-100 text-emerald-800',
        implemented: 'bg-emerald-100 text-emerald-800',
        rejected: 'bg-red-100 text-red-800'
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Feature Recommendations</h1>
                    <p className="text-gray-500">Manage user feedback and requests</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
                    <span className="font-bold text-2xl">{recommendations?.length || 0}</span>
                    <span className="text-gray-500 ml-2">Total</span>
                </div>
            </div>

            <div className="space-y-4">
                {recommendations?.map((item: any) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="capitalize">{item.type}</Badge>
                                        <Badge className={statusColors[item.status] || 'bg-gray-100'}>
                                            {item.status}
                                        </Badge>
                                        <span className="text-xs text-gray-400">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg">{item.title}</CardTitle>
                                </div>
                                {/* Actions (Placeholder for now) */}
                                {/* <div className="flex gap-2">
                                    <Button size="icon" variant="ghost"><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>
                                    <Button size="icon" variant="ghost"><XCircle className="h-4 w-4 text-red-600" /></Button>
                                </div> */}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 mb-4">{item.description}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 border-t pt-3">
                                <span>Submitted by:</span>
                                <span className="font-medium text-gray-900">{item.user?.full_name || 'Unknown'}</span>
                                <span>({item.user?.email})</span>
                                <Badge variant="secondary" className="text-xs">{item.user?.role}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {(!recommendations || recommendations.length === 0) && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No recommendations found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
