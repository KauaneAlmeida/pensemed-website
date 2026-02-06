'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getProductImages } from '@/hooks/useProductImages';

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
  caixaTabela,
  caixaSlug,
  caixaNome,
  imagemUrlFallback,
  tipo = 'cme',
}: ProdutoRelacionadoCardProps) {
  const [imagemUrl, setImagemUrl] = useState<string | null>(imagemUrlFallback || null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      const productId = typeof id === 'string' ? parseInt(id, 10) : id;

      if (isNaN(productId)) {
        setLoading(false);
        return;
      }

      try {
        // Passa o nome do produto para permitir busca em tabelas com estrutura especial
        const { data, error } = await getProductImages(productId, caixaTabela, nome);

        if (!error && data && data.length > 0) {
          // Usa a imagem principal ou a primeira
          const imagemPrincipal = data.find(img => img.principal) || data[0];
          if (imagemPrincipal?.url) {
            setImagemUrl(imagemPrincipal.url);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar imagem do produto relacionado:', err);
      }

      setLoading(false);
    };

    fetchImage();
  }, [id, caixaTabela, nome]);

  const baseUrl = tipo === 'equipamentos' ? '/equipamentos-medicos' : '/instrumentacao-cme';
  const hoverColor = tipo === 'equipamentos' ? 'hover:border-[#2a7a8a]/30' : 'hover:border-[#205b67]/30';
  const textHoverColor = tipo === 'equipamentos' ? 'group-hover:text-[#2a7a8a]' : 'group-hover:text-[#205b67]';
  const spinnerColor = tipo === 'equipamentos' ? 'border-t-[#2a7a8a]' : 'border-t-[#205b67]';

  return (
    <Link
      href={`${baseUrl}/${caixaSlug}/${id}`}
      className={`group bg-white rounded-lg sm:rounded-xl border border-gray-100 ${hoverColor} hover:shadow-lg transition-all duration-300 overflow-hidden`}
    >
      {/* Imagem */}
      <div className="aspect-square relative bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-200 ${spinnerColor} rounded-full animate-spin`} />
          </div>
        ) : imagemUrl && !imageError ? (
          <Image
            src={imagemUrl}
            alt={nome}
            fill
            className="object-contain p-2 sm:p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
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
