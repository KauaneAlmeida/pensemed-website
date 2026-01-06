'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ImageGalleryCompact, GalleryImage } from './ImageGallery';
import { getProductImages, ProductImage } from '@/hooks/useProductImages';
import { getWhatsAppProdutoLink } from '@/lib/whatsapp';

interface ProductCardWithGalleryProps {
  produto: {
    id: number | string;
    nome: string;
    codigo?: string | null;
    descricao?: string | null;
    imagem_url?: string | null;
  };
  nomeTabela: string;
  href: string;
  showWhatsApp?: boolean;
}

/**
 * Card de produto com galeria de imagens integrada
 * Busca imagens automaticamente do Supabase
 */
export default function ProductCardWithGallery({
  produto,
  nomeTabela,
  href,
  showWhatsApp = true,
}: ProductCardWithGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  const whatsappLink = getWhatsAppProdutoLink(produto.nome);

  // Busca imagens do produto
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);

      const productId = typeof produto.id === 'string' ? parseInt(produto.id, 10) : produto.id;

      if (isNaN(productId)) {
        // Se não tem ID numérico, usa imagem padrão do produto
        if (produto.imagem_url) {
          setImages([{ url: produto.imagem_url, principal: true }]);
        }
        setLoading(false);
        return;
      }

      const { data, error } = await getProductImages(productId, nomeTabela);

      if (!error && data && data.length > 0) {
        setImages(data.map(img => ({
          id: img.id,
          url: img.url,
          ordem: img.ordem,
          principal: img.principal,
        })));
      } else if (produto.imagem_url) {
        // Fallback para imagem_url do produto se não encontrar na tabela de imagens
        setImages([{ url: produto.imagem_url, principal: true }]);
      }

      setLoading(false);
    };

    fetchImages();
  }, [produto.id, produto.imagem_url, nomeTabela]);

  // Verifica se o código é válido para exibição
  const codigoValido = (codigo: string | null | undefined): boolean => {
    if (!codigo) return false;
    const codigoLimpo = codigo.trim();
    if (codigoLimpo.length > 20) return false;
    if (/^[A-Za-z0-9+/]{15,}={0,2}$/.test(codigoLimpo)) return false;
    return true;
  };

  return (
    <Link
      href={href}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-medical/30 hover:shadow-lg transition-all duration-300 block"
    >
      {/* Área da imagem/galeria */}
      <div className="relative">
        {loading ? (
          // Skeleton loading
          <div className="aspect-square bg-gray-100 animate-pulse" />
        ) : images.length > 0 ? (
          // Galeria de imagens
          <ImageGalleryCompact
            images={images}
            productName={produto.nome}
          />
        ) : (
          // Placeholder sem imagem
          <div className="aspect-square relative bg-gray-50 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        )}

        {/* Botão WhatsApp */}
        {showWhatsApp && (
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(whatsappLink, '_blank');
            }}
            className="absolute bottom-2 right-2 w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-[#20bd5a] shadow-lg cursor-pointer z-20"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </span>
        )}
      </div>

      {/* Informações do produto */}
      <div className="p-4">
        {produto.codigo && codigoValido(produto.codigo) && (
          <span className="text-medical text-xs font-medium">Cód: {produto.codigo}</span>
        )}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mt-1 group-hover:text-medical transition-colors">
          {produto.nome}
        </h3>
        {produto.descricao && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{produto.descricao}</p>
        )}
      </div>
    </Link>
  );
}

/**
 * Versão simplificada do card que recebe imagens diretamente (sem fetch)
 */
export function ProductCardSimple({
  produto,
  images,
  href,
  showWhatsApp = true,
}: {
  produto: {
    id: number | string;
    nome: string;
    codigo?: string | null;
    descricao?: string | null;
  };
  images: GalleryImage[];
  href: string;
  showWhatsApp?: boolean;
}) {
  const whatsappLink = getWhatsAppProdutoLink(produto.nome);

  const codigoValido = (codigo: string | null | undefined): boolean => {
    if (!codigo) return false;
    const codigoLimpo = codigo.trim();
    if (codigoLimpo.length > 20) return false;
    if (/^[A-Za-z0-9+/]{15,}={0,2}$/.test(codigoLimpo)) return false;
    return true;
  };

  return (
    <Link
      href={href}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-medical/30 hover:shadow-lg transition-all duration-300 block"
    >
      <div className="relative">
        {images.length > 0 ? (
          <ImageGalleryCompact images={images} productName={produto.nome} />
        ) : (
          <div className="aspect-square relative bg-gray-50 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        )}

        {showWhatsApp && (
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(whatsappLink, '_blank');
            }}
            className="absolute bottom-2 right-2 w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-[#20bd5a] shadow-lg cursor-pointer z-20"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </span>
        )}
      </div>

      <div className="p-4">
        {produto.codigo && codigoValido(produto.codigo) && (
          <span className="text-medical text-xs font-medium">Cód: {produto.codigo}</span>
        )}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mt-1 group-hover:text-medical transition-colors">
          {produto.nome}
        </h3>
        {produto.descricao && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{produto.descricao}</p>
        )}
      </div>
    </Link>
  );
}
