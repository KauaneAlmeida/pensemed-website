'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
}

export default function BackButton({
  fallbackUrl = '/catalogo',
  label = 'Voltar',
  className = '',
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Verifica se há histórico de navegação
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
