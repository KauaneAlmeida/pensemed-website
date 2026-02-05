
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Produto } from '@/lib/types';

interface ProductCardProps {
  produto: Produto;
}

export default function ProductCard({ produto }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Imagem do Produto */}
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        {produto.imagem_url && !imageError ? (
          <Image
            src={produto.imagem_url}
            alt={produto.nome}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-medical-light to-gray-200">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Conteúdo do Card */}
      <div className="p-5">
        {/* Código do Produto */}
        {produto.codigo_produto && (
          <p className="text-xs text-medical font-semibold mb-2">
            Cód: {produto.codigo_produto}
          </p>
        )}

        {/* Nome do Produto */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {produto.nome}
        </h3>

        {/* Descrição Curta */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {produto.descricao_curta}
        </p>

        {/* Botão de Detalhes */}
        <Link
          href={`/produtos/${produto.slug}`}
          className="block w-full text-center px-4 py-2.5 bg-medical hover:bg-medical-dark text-white rounded-lg font-semibold transition-colors duration-200"
        >
          Ver Detalhes
        </Link>
      </div>
    </div>
  );
}
