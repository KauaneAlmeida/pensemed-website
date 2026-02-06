'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ProdutoRelacionadoCardProps {
  id: string | number;
  nome: string;
  caixaTabela: string;
  caixaSlug: string;
  caixaNome: string;
  imagemUrlFallback?: string | null;
  tipo?: 'cme' | 'equipamentos';
}

export default function ProdutoRelacionadoCard({
  id,
  nome,
  caixaSlug,
  caixaNome,
  imagemUrlFallback,
  tipo = 'cme',
}: ProdutoRelacionadoCardProps) {
  // Imagem é pré-carregada server-side - não fazer fetch client-side (falha em produção Vercel)
  const imagemUrl = imagemUrlFallback || null;
  const [imageError, setImageError] = useState(false);

  const baseUrl = tipo === 'equipamentos' ? '/equipamentos-medicos' : '/instrumentacao-cme';
  const hoverColor = tipo === 'equipamentos' ? 'hover:border-[#2a7a8a]/30' : 'hover:border-[#205b67]/30';
  const textHoverColor = tipo === 'equipamentos' ? 'group-hover:text-[#2a7a8a]' : 'group-hover:text-[#205b67]';

  return (
    <Link
      href={`${baseUrl}/${caixaSlug}/${id}`}
      className={`group bg-white rounded-lg sm:rounded-xl border border-gray-100 ${hoverColor} hover:shadow-lg transition-all duration-300 overflow-hidden`}
    >
      {/* Imagem */}
      <div className="aspect-square relative bg-white">
        {imagemUrl && !imageError ? (
          <Image
            src={imagemUrl}
            alt={nome}
            fill
            className="object-contain p-2 sm:p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <Image
            src="/images/placeholder-produto.svg"
            alt={nome}
            fill
            className="object-contain p-4"
          />
        )}
      </div>

      {/* Info */}
      <div className="p-2 sm:p-4">
        <h3 className={`font-medium text-xs sm:text-sm text-gray-900 line-clamp-2 ${textHoverColor} transition-colors`}>
          {nome}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-1">{caixaNome}</p>
      </div>
    </Link>
  );
}
