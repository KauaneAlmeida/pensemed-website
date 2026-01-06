'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImagemProduto } from '@/lib/api';
import { ImageGalleryFull, GalleryImage } from './ImageGallery';

interface ProdutoComGaleriaProps {
  produto: {
    id: number;
    nome: string;
    descricao: string | null;
    codigo?: string | null;
    imagemPrincipal: string | null;
    galeriaDeImagens: ImagemProduto[] | GalleryImage[];
  };
}

/**
 * Componente para exibir produto com galeria de imagens completa
 * Padrão 1:N (produto -> imagens)
 * Usado na página de detalhes do produto
 */
export default function ProdutoComGaleria({ produto }: ProdutoComGaleriaProps) {
  // Converte para o formato esperado pelo ImageGalleryFull
  const images: GalleryImage[] = produto.galeriaDeImagens.map(img => ({
    id: 'id' in img ? img.id : undefined,
    url: img.url,
    ordem: 'ordem' in img ? img.ordem : undefined,
    principal: 'principal' in img ? img.principal : false,
  }));

  // Se não tem imagens na galeria mas tem imagemPrincipal, usa ela
  const finalImages = images.length > 0
    ? images
    : produto.imagemPrincipal
      ? [{ url: produto.imagemPrincipal, principal: true }]
      : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Galeria de Imagens */}
      <ImageGalleryFull
        images={finalImages}
        productName={produto.nome}
      />

      {/* Informações do Produto */}
      <div className="space-y-4">
        {produto.codigo && (
          <span className="text-medical text-sm font-medium">
            Cód: {produto.codigo}
          </span>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{produto.nome}</h1>
        {produto.descricao && (
          <p className="text-gray-600">{produto.descricao}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Card simples para listagem (usa imagem principal com zoom no hover)
 */
export function ProdutoCard({ produto }: ProdutoComGaleriaProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Pega a imagem principal ou a primeira da galeria
  const imagemExibida = produto.imagemPrincipal
    || produto.galeriaDeImagens.find(img => 'principal' in img && img.principal)?.url
    || produto.galeriaDeImagens[0]?.url
    || null;

  return (
    <div
      className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagem Principal no Card com Zoom */}
      <div className="aspect-square relative bg-gray-50 overflow-hidden">
        {imagemExibida ? (
          <Image
            src={imagemExibida}
            alt={produto.nome}
            fill
            className={`object-contain p-4 transition-transform duration-300 ease-in-out ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badge de quantidade de imagens */}
        {produto.galeriaDeImagens.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {produto.galeriaDeImagens.length} fotos
          </span>
        )}
      </div>

      <div className="p-4">
        {produto.codigo && (
          <span className="text-medical text-xs font-medium">
            Cód: {produto.codigo}
          </span>
        )}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mt-1">
          {produto.nome}
        </h3>
      </div>
    </div>
  );
}

/**
 * Card com galeria navegável (setas + indicadores + zoom)
 */
export function ProdutoCardComGaleria({ produto }: ProdutoComGaleriaProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const images = produto.galeriaDeImagens;
  const hasMultipleImages = images.length > 1;

  // Encontra o índice da imagem principal
  useEffect(() => {
    const principalIndex = images.findIndex(img => 'principal' in img && img.principal);
    if (principalIndex !== -1) {
      setCurrentIndex(principalIndex);
    }
  }, [images]);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const currentImage = images[currentIndex]?.url || produto.imagemPrincipal;

  return (
    <div
      className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Área da imagem com galeria */}
      <div className="aspect-square relative bg-gray-50 overflow-hidden">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={`${produto.nome}${hasMultipleImages ? ` - ${currentIndex + 1}/${images.length}` : ''}`}
            fill
            className={`object-contain p-4 transition-transform duration-300 ease-in-out ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Setas de navegação */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full
                         opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/70 z-10"
              aria-label="Imagem anterior"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full
                         opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/70 z-10"
              aria-label="Próxima imagem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Indicadores (dots) */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Badge de contagem */}
        {hasMultipleImages && (
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full
                          opacity-0 group-hover:opacity-100 transition-opacity">
            {currentIndex + 1}/{images.length}
          </span>
        )}
      </div>

      <div className="p-4">
        {produto.codigo && (
          <span className="text-medical text-xs font-medium">
            Cód: {produto.codigo}
          </span>
        )}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mt-1">
          {produto.nome}
        </h3>
      </div>
    </div>
  );
}
