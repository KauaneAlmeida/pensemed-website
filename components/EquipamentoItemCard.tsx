'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { EquipamentoMedico, codigoValido } from '@/lib/types';

interface EquipamentoItemCardProps {
  equipamento: EquipamentoMedico;
  slugCategoria: string; // Slug da categoria/tabela para routing
}

export default function EquipamentoItemCard({ equipamento, slugCategoria }: EquipamentoItemCardProps) {
  const [imageError, setImageError] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Imagem do Equipamento */}
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        {equipamento.imagem_url && !imageError ? (
          <Image
            src={equipamento.imagem_url}
            alt={equipamento.nome}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a7a8a]/15 to-gray-200">
            <svg
              className="w-20 h-20 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Conteudo do Card */}
      <div className="p-5">
        {/* Codigo do Produto (só mostra se for código válido) */}
        {codigoValido(equipamento.codigo) && (
          <p className="text-xs text-[#2a7a8a] font-semibold mb-2">
            Cód: {equipamento.codigo}
          </p>
        )}

        {/* Nome do Equipamento */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 min-h-[3.5rem]">
          {equipamento.nome}
        </h3>

        {/* Descricao (se disponivel) */}
        {equipamento.descricao && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {equipamento.descricao}
          </p>
        )}

        {/* Botao Ver Detalhes */}
        <Link
          href={`/equipamentos-medicos/${slugCategoria}/${equipamento.id}`}
          className="block w-full text-center px-4 py-2.5 bg-[#2a7a8a] hover:bg-[#205b67] text-white rounded-lg font-semibold transition-colors duration-200"
        >
          Ver Detalhes
        </Link>
      </div>
    </div>
  );
}
