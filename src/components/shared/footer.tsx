import Link from 'next/link'

export function Footer() {
    return (
        <footer className="border-t border-gray-100 bg-gray-50">
            <div className="container mx-auto px-4 py-12">
                <div className="grid gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                                <span className="text-lg font-bold text-white">M</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                                My<span className="text-emerald-600">Jara</span>
                            </span>
                        </Link>
                        <p className="mt-4 text-sm text-gray-500">
                            Discover products. Enjoy more.
                            The Nigerian marketplace where you always get extra.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Marketplace</h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <Link href="/search" className="text-sm text-gray-500 hover:text-emerald-600">
                                    Explore Products
                                </Link>
                            </li>
                            <li>
                                <Link href="/categories" className="text-sm text-gray-500 hover:text-emerald-600">
                                    Categories
                                </Link>
                            </li>
                            <li>
                                <Link href="/how-it-works" className="text-sm text-gray-500 hover:text-emerald-600">
                                    How Jara Works
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Brands */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">For Brands</h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <Link href="/register/brand" className="text-sm text-gray-500 hover:text-emerald-600">
                                    Sell on MyJara
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-emerald-600">
                                    Brand Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/help/brands" className="text-sm text-gray-500 hover:text-emerald-600">
                                    Brand Resources
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Support</h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <Link href="/help" className="text-sm text-gray-500 hover:text-emerald-600">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-sm text-gray-500 hover:text-emerald-600">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-sm text-gray-500 hover:text-emerald-600">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-sm text-gray-500 hover:text-emerald-600">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 md:flex-row">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} MyJara. All rights reserved.
                    </p>
                    <p className="text-sm text-gray-400">
                        Made with 💚 in Nigeria
                    </p>
                </div>
            </div>
        </footer>
    )
}
