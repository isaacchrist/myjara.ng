export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-8 animate-pulse">
            <div className="h-10 w-full bg-gray-100 rounded mb-8" />
            <div className="flex gap-8">
                <div className="w-64 h-96 bg-gray-100 rounded hidden lg:block" />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-80 bg-gray-100 rounded" />
                    ))}
                </div>
            </div>
        </div>
    )
}
