
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
          <Image
            src="/images/placeholder-produto.svg"
            alt={produto.nome}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
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
