import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminRecommendationsPage() {
    const supabase = await createAdminClient()

    const { data: recommendations } = await supabase
        .from('feature_recommendations')
        .select(`
            *,
            user:users(full_name, email, role)
        `)
        .order('created_at', { ascending: false })

    const statusColors: any = {
        pending: 'bg-yellow-500/20 text-yellow-400',
        reviewed: 'bg-emerald-500/20 text-emerald-400',
        implemented: 'bg-emerald-500/20 text-emerald-400',
        rejected: 'bg-red-500/20 text-red-400'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Feature Recommendations</h1>
                    <p className="text-gray-400">Manage user feedback and requests</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg">
                    <span className="font-bold text-2xl text-white">{recommendations?.length || 0}</span>
                    <span className="text-gray-400 ml-2">Total</span>
                </div>
            </div>

            <div className="space-y-4">
                {(recommendations as any[])?.map((item) => (
                    <Card key={item.id} className="bg-gray-800 border-gray-700">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="capitalize border-gray-600 text-gray-300">{item.type}</Badge>
                                        <Badge className={statusColors[item.status] || 'bg-gray-700 text-gray-300'}>
                                            {item.status}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg text-white">{item.title}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-300 mb-4">{item.description}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-400 border-t border-gray-700 pt-3">
                                <span>Submitted by:</span>
                                <span className="font-medium text-gray-200">{item.user?.full_name || 'Unknown'}</span>
                                <span>({item.user?.email})</span>
                                <Badge variant="secondary" className="text-xs">{item.user?.role}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {(!recommendations || recommendations.length === 0) && (
                    <div className="text-center py-12 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <p className="text-gray-400">No recommendations found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
