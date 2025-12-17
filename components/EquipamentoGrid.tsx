import { CategoriaEquipamento } from '@/lib/types';
import EquipamentoCard from './EquipamentoCard';

interface EquipamentoGridProps {
  categorias: CategoriaEquipamento[];
}

export default function EquipamentoGrid({ categorias }: EquipamentoGridProps) {
  if (categorias.length === 0) {
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
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhum equipamento encontrado
        </h3>
        <p className="text-gray-600">
          Não há equipamentos médicos disponíveis no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categorias.map((categoria) => (
        <EquipamentoCard key={categoria.slug} categoria={categoria} />
      ))}
    </div>
  );
}
