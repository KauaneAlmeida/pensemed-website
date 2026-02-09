'use client';

import Image from 'next/image';

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
          <Image
            src="/images/Logo.png"
            alt="PenseMed - Tecnologia Hospitalar"
            width={400}
            height={400}
            priority
            className="w-[250px] sm:w-[300px] md:w-[350px] h-auto"
          />
        </div>

        {/* Spinner elegante */}
        <div className="relative">
          <div className="w-8 h-8 border-2 border-slate-200 rounded-full" />
          <div className="absolute top-0 left-0 w-8 h-8 border-2 border-transparent border-t-[#205b67] rounded-full animate-spin" />
        </div>

        {/* Texto opcional */}
        {showMessage && (
          <p className="text-slate-400 text-sm mt-6">{message}</p>
        )}
      </div>
    </div>
  );
}
