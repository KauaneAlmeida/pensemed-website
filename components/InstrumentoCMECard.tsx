'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { InstrumentoCME, codigoValido } from '@/lib/types';

interface InstrumentoCMECardProps {
  instrumento: InstrumentoCME;
  slugCaixa: string; // Slug da caixa/tabela para routing
}

export default function InstrumentoCMECard({ instrumento, slugCaixa }: InstrumentoCMECardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 overflow-hidden group">
      {/* Imagem do Instrumento - mais compacta */}
      <div className="relative h-40 bg-gray-50 overflow-hidden">
        {instrumento.imagem_url && !imageError ? (
          <Image
            src={instrumento.imagem_url}
            alt={`${instrumento.categoria} - ${instrumento.codigo}`}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <Image
            src="/images/placeholder-produto.svg"
            alt={instrumento.nome}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        )}
      </div>

      {/* Conteúdo do Card - mais compacto */}
      <div className="p-3">
        {/* Código do Produto (só mostra se for código válido) */}
        {codigoValido(instrumento.codigo) && (
          <p className="text-xs text-medical font-medium mb-1">
            {instrumento.codigo}
          </p>
        )}

        {/* Nome do Instrumento */}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {instrumento.nome}
        </h3>

        {/* Botão Ver Detalhes - mais compacto */}
        <Link
          href={`/instrumentacao-cme/${slugCaixa}/${instrumento.codigo}`}
          className="block w-full text-center px-3 py-2 bg-medical hover:bg-medical-dark text-white rounded-md text-sm font-medium transition-colors duration-200"
        >
          Ver Detalhes
        </Link>
      </div>
    </div>
  );
}
