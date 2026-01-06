'use client';

interface LoadingScreenProps {
  message?: string;
  showMessage?: boolean;
}

export default function LoadingScreen({
  message = 'Carregando...',
  showMessage = false
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        {/* Logo PenseMed */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">
            <span className="text-blue-600">Pense</span>
            <span className="text-slate-700">Med</span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-2 tracking-[0.2em] uppercase text-center">
            tecnologia médica
          </p>
        </div>

        {/* Spinner elegante */}
        <div className="relative">
          <div className="w-8 h-8 border-2 border-slate-200 rounded-full" />
          <div className="absolute top-0 left-0 w-8 h-8 border-2 border-transparent border-t-blue-600 rounded-full animate-spin" />
        </div>

        {/* Texto opcional */}
        {showMessage && (
          <p className="text-slate-400 text-sm mt-6">{message}</p>
        )}
      </div>
    </div>
  );
}
