'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CategoriaEquipamento } from '@/lib/types';

interface EquipamentoCardProps {
  categoria: CategoriaEquipamento;
}

export default function EquipamentoCard({ categoria }: EquipamentoCardProps) {
  const [imageError, setImageError] = useState(false);
  return (
    <Link
      href={`/equipamentos-medicos/${categoria.slug}`}
      className="group block"
    >
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 overflow-hidden h-full">
        {/* Imagem do Equipamento - mais compacta */}
        <div className="relative h-40 bg-gray-50 overflow-hidden">
          {categoria.imagem_url && !imageError ? (
            <Image
              src={categoria.imagem_url}
              alt={categoria.nome_exibicao}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <Image
              src="/images/placeholder-produto.svg"
              alt={categoria.nome_exibicao}
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          )}

          {/* Badge de quantidade */}
          <div className="absolute top-2 right-2 bg-[#2a7a8a] text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {categoria.total_itens} itens
          </div>
        </div>

        {/* Conteudo do Card - mais compacto */}
        <div className="p-3">
          {/* Nome do Equipamento */}
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
            {categoria.nome_exibicao}
          </h3>

          {/* Call to Action */}
          <div className="flex items-center justify-between text-[#2a7a8a] text-sm font-medium">
            <span>Ver detalhes</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
