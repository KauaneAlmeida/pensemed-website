import { CaixaCME } from '@/lib/types';
import CaixaCMECard from './CaixaCMECard';

interface CaixaCMEGridProps {
  caixas: CaixaCME[];
}

export default function CaixaCMEGrid({ caixas }: CaixaCMEGridProps) {
  if (caixas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma caixa encontrada
        </h3>
        <p className="text-gray-600">
          Não há caixas de instrumentos disponíveis no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {caixas.map((caixa) => (
        <CaixaCMECard key={caixa.slug} caixa={caixa} />
      ))}
    </div>
  );
}
