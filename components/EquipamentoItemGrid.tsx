import { EquipamentoMedico } from '@/lib/types';
import EquipamentoItemCard from './EquipamentoItemCard';

interface EquipamentoItemGridProps {
  equipamentos: EquipamentoMedico[];
  slugCategoria: string; // Slug da categoria para routing
}

export default function EquipamentoItemGrid({ equipamentos, slugCategoria }: EquipamentoItemGridProps) {
  if (equipamentos.length === 0) {
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
          Nao ha equipamentos disponiveis nesta categoria no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {equipamentos.map((equipamento) => (
        <EquipamentoItemCard
          key={equipamento.id}
          equipamento={equipamento}
          slugCategoria={slugCategoria}
        />
      ))}
    </div>
  );
}
