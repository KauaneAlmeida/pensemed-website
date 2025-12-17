export default function LoadingCaixaCME() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-5 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
      </div>

      {/* Header Skeleton */}
      <section className="bg-gradient-to-br from-medical to-medical-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="h-10 bg-white/20 rounded-lg w-96 mx-auto mb-3 animate-pulse" />
            <div className="h-6 bg-white/20 rounded-lg w-48 mx-auto animate-pulse" />
          </div>
        </div>
      </section>

      {/* Grid Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
              <div className="h-64 bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded w-full" />
                <div className="h-10 bg-gray-200 rounded w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
