import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, Key, Bell, Shield, Database, Globe } from 'lucide-react'

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
                <p className="text-gray-400">Configure platform-wide settings</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* General Settings */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Settings className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-white">General</CardTitle>
                                <CardDescription className="text-gray-400">Basic platform configuration</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400">Platform Name</label>
                            <Input defaultValue="MyJara" className="bg-gray-700 border-gray-600 text-white mt-1" disabled />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Default Currency</label>
                            <Input defaultValue="NGN (₦)" className="bg-gray-700 border-gray-600 text-white mt-1" disabled />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <Shield className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <CardTitle className="text-white">Security</CardTitle>
                                <CardDescription className="text-gray-400">Admin access & security</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400">Admin Secret Key</label>
                            <Input type="password" defaultValue="••••••••••••" className="bg-gray-700 border-gray-600 text-white mt-1" disabled />
                        </div>
                        <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:text-white" disabled>
                            <Key className="h-4 w-4 mr-2" />
                            Rotate Admin Key
                        </Button>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Bell className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                                <CardTitle className="text-white">Notifications</CardTitle>
                                <CardDescription className="text-gray-400">Email & alert settings</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">New seller registration alerts</span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Enabled</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Transaction alerts</span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Enabled</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Dispute alerts</span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Enabled</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Database */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Database className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <CardTitle className="text-white">Database</CardTitle>
                                <CardDescription className="text-gray-400">Supabase connection</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Connection Status</span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded flex items-center gap-1">
                                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                Connected
                            </span>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Database URL</label>
                            <Input type="password" defaultValue="••••••••••••••••••••" className="bg-gray-700 border-gray-600 text-white mt-1" disabled />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Version Info */}
            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-300">MyJara Platform</span>
                    </div>
                    <span className="text-gray-500 text-sm">Version 1.0.0 (Beta)</span>
                </CardContent>
            </Card>
        </div>
    )
}
