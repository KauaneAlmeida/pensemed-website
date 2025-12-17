export default function LoadingInstrumentoDetail() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-5 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
      </div>

      {/* Conteúdo Principal Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Imagem Skeleton */}
            <div className="relative bg-gray-200 min-h-[400px] lg:min-h-[600px] animate-pulse" />

            {/* Informações Skeleton */}
            <div className="p-8 space-y-6">
              <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
              <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
              <div className="space-y-3">
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
