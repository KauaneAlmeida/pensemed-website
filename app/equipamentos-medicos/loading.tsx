export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="h-12 bg-emerald-500/50 rounded-lg w-96 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-emerald-500/50 rounded w-2/3 mx-auto mb-2 animate-pulse" />
            <div className="h-5 bg-emerald-500/50 rounded w-1/2 mx-auto animate-pulse" />
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-6 bg-gray-200 rounded w-48 mb-8 animate-pulse" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-64 bg-gray-200 animate-pulse" />
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
