'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export interface Variacao {
  id: number;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  imagem_url: string | null;
  variacaoTexto: string;
  tipoVariacao: 'numero' | 'medida' | null;
}

interface VariacaoSelectorProps {
  variacoes: Variacao[];
  variacaoAtualId: number;
  baseUrl: string; // Ex: /instrumentacao-cme/slug
  nomeExibicao: string;
  cor?: 'blue' | 'emerald'; // blue para CME, emerald para Equipamentos
  onVariacaoChange?: (variacao: Variacao) => void;
}

export default function VariacaoSelector({
  variacoes,
  variacaoAtualId,
  baseUrl,
  nomeExibicao,
  cor = 'blue',
  onVariacaoChange,
}: VariacaoSelectorProps) {
  const router = useRouter();
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<Variacao | null>(
    variacoes.find(v => v.id === variacaoAtualId) || variacoes[0] || null
  );

  // Atualizar quando o ID atual mudar
  useEffect(() => {
    const atual = variacoes.find(v => v.id === variacaoAtualId);
    if (atual) {
      setVariacaoSelecionada(atual);
    }
  }, [variacaoAtualId, variacoes]);

  if (!variacoes || variacoes.length <= 1) {
    return null;
  }

  const handleVariacaoClick = (variacao: Variacao) => {
    setVariacaoSelecionada(variacao);

    if (onVariacaoChange) {
      onVariacaoChange(variacao);
    }

    // Navegar para a página da variação selecionada
    router.push(`${baseUrl}/${variacao.id}`);
  };

  // Classes de cor baseadas na prop
  const corClasses = {
    blue: {
      selected: 'border-medical bg-medical-light text-medical',
      hover: 'hover:border-medical/50',
      title: 'text-medical',
    },
    emerald: {
      selected: 'border-[#2a7a8a] bg-[#2a7a8a]/10 text-[#2a7a8a]',
      hover: 'hover:border-[#2a7a8a]/50',
      title: 'text-[#2a7a8a]',
    },
  };

  const classes = corClasses[cor];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Selecione a variação:
      </h2>
      <div className="flex flex-wrap gap-2">
        {variacoes.map((variacao) => (
          <button
            key={variacao.id}
            onClick={() => handleVariacaoClick(variacao)}
            className={`
              px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200
              ${variacaoSelecionada?.id === variacao.id
                ? classes.selected
                : `border-gray-200 bg-white text-gray-700 ${classes.hover}`
              }
            `}
          >
            {variacao.variacaoTexto}
          </button>
        ))}
      </div>

      {/* Info da variação selecionada */}
      {variacaoSelecionada && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Variação selecionada:</span>{' '}
            <span className={classes.title}>{variacaoSelecionada.variacaoTexto}</span>
          </p>
          {variacaoSelecionada.codigo && variacaoSelecionada.codigo.length < 20 && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Código:</span> {variacaoSelecionada.codigo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Componente para exibir preview de variações no formato de chips menores
 * Usado quando não há navegação, apenas exibição
 */
export function VariacaoChips({
  variacoes,
  variacaoAtualId,
  cor = 'blue',
}: {
  variacoes: Variacao[];
  variacaoAtualId: number;
  cor?: 'blue' | 'emerald';
}) {
  if (!variacoes || variacoes.length <= 1) {
    return null;
  }

  const corClasses = {
    blue: {
      selected: 'bg-medical text-white',
      normal: 'bg-gray-100 text-gray-600',
    },
    emerald: {
      selected: 'bg-[#2a7a8a] text-white',
      normal: 'bg-gray-100 text-gray-600',
    },
  };

  const classes = corClasses[cor];

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {variacoes.map((variacao) => (
        <span
          key={variacao.id}
          className={`
            px-2 py-1 rounded text-xs font-medium
            ${variacao.id === variacaoAtualId ? classes.selected : classes.normal}
          `}
        >
          {variacao.variacaoTexto}
        </span>
      ))}
    </div>
  );
}
