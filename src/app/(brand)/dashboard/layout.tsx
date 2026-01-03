import Link from 'next/link'
import {
    LayoutDashboard,
    Package,
    Gift,
    Truck,
    ShoppingCart,
    MessageCircle,
    BarChart3,
    Settings,
    LogOut,
    ChevronRight
} from 'lucide-react'

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Package, label: 'Products', href: '/dashboard/products' },
    { icon: Gift, label: 'Jara Offers', href: '/dashboard/jara' },
    { icon: Truck, label: 'Logistics', href: '/dashboard/logistics' },
    { icon: ShoppingCart, label: 'Orders', href: '/dashboard/orders' },
    { icon: MessageCircle, label: 'Messages', href: '/dashboard/messages', badge: 3 },
    { icon: MessageCircle, label: 'Support', href: '/dashboard/support' },
    { icon: Truck, label: 'Operations', href: '/dashboard/operations' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-gray-200 bg-white md:block">
                {/* Logo */}
                <div className="flex h-16 items-center border-b border-gray-100 px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                            <span className="text-sm font-bold text-white">M</span>
                        </div>
                        <span className="font-bold text-gray-900">
                            My<span className="text-emerald-600">Jara</span>
                        </span>
                    </Link>
                </div>

                {/* Store Info */}
                <div className="border-b border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-lg">
                            🏪
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate font-medium text-gray-900">FoodMart Nigeria</p>
                            <p className="text-xs text-gray-500">Brand Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {sidebarItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                    {item.badge && (
                                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Logout */}
                <div className="border-t border-gray-100 p-4">
                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/dashboard" className="hover:text-emerald-600">Dashboard</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-gray-900">Overview</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-sm text-gray-500 hover:text-emerald-600"
                        >
                            View Store →
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
