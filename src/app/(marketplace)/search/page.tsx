import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SearchPage() {
    // Hardcoded products for testing - no database calls
    const mockProducts = [
        { id: '1', name: 'Test Product 1', price: 5000 },
        { id: '2', name: 'Test Product 2', price: 7500 },
        { id: '3', name: 'Test Product 3', price: 3000 },
    ]

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Search Page - Test Mode
                </h1>
                <p className="text-green-600 font-semibold mb-8">
                    ✅ If you can see this, the page is working!
                </p>

                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Mock Products</h2>
                    <div className="grid gap-4">
                        {mockProducts.map(product => (
                            <div key={product.id} className="border rounded p-4 flex justify-between items-center">
                                <span className="font-medium">{product.name}</span>
                                <span className="text-emerald-600">₦{product.price.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Link href="/" className="text-blue-600 underline">
                    ← Back to Home
                </Link>
            </div>
        </div>
    )
}
