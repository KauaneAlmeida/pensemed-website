export default function CatalogoLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="h-5 bg-gray-200 rounded w-48 mb-6 animate-pulse" />

        <div className="flex gap-8">
          {/* Sidebar skeleton */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </aside>

          {/* Main content skeleton */}
          <main className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
