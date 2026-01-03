import Link from 'next/link'
import {
    LayoutDashboard,
    Store,
    FolderTree,
    CreditCard,
    Users,
    BarChart3,
    Settings,
    Shield,
    LogOut,
    ChevronRight
} from 'lucide-react'

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
    { icon: Store, label: 'Stores', href: '/admin/stores', badge: 5 },
    { icon: FolderTree, label: 'Categories', href: '/admin/categories' },
    { icon: CreditCard, label: 'Transactions', href: '/admin/transactions' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-gray-900">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-gray-800 bg-gray-900 md:block">
                {/* Logo */}
                <div className="flex h-16 items-center border-b border-gray-800 px-6">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                            <Shield className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-white">
                            MyJara <span className="text-red-400">Admin</span>
                        </span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {sidebarItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                    {item.badge && (
                                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Logout */}
                <div className="border-t border-gray-800 p-4">
                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white">
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Link href="/admin" className="hover:text-white">Admin</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-white">Overview</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-sm text-gray-400 hover:text-white"
                        >
                            View Site →
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
