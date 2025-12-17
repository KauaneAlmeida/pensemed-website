import { InstrumentoCME, agruparInstrumentosPorNome } from '@/lib/types';
import InstrumentoCMECard from './InstrumentoCMECard';
import InstrumentoGrupoCard from './InstrumentoGrupoCard';

interface InstrumentoCMEGridProps {
  instrumentos: InstrumentoCME[];
  slugCaixa: string; // Slug da caixa/tabela para routing
}

export default function InstrumentoCMEGrid({ instrumentos, slugCaixa }: InstrumentoCMEGridProps) {
  if (instrumentos.length === 0) {
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
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhum instrumento encontrado
        </h3>
        <p className="text-gray-600">
          Não há instrumentos disponíveis nesta subcategoria no momento.
        </p>
      </div>
    );
  }

  // Agrupar instrumentos por nome base
  const grupos = agruparInstrumentosPorNome(instrumentos);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {grupos.map((grupo) => {
          if (grupo.isAgrupado) {
            // Card de grupo (múltiplos itens)
            return (
              <InstrumentoGrupoCard
                key={`grupo-${grupo.nomeBase}`}
                grupo={grupo}
                slugCaixa={slugCaixa}
              />
            );
          } else {
            // Card individual (item único)
            return (
              <InstrumentoCMECard
                key={grupo.instrumentos[0].id}
                instrumento={grupo.instrumentos[0]}
                slugCaixa={slugCaixa}
              />
            );
          }
        })}
    </div>
  );
}
