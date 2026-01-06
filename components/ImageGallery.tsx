'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

export interface GalleryImage {
  id?: string;
  url: string;
  ordem?: number;
  principal?: boolean;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  productName: string;
  className?: string;
  showIndicators?: boolean;
  showArrows?: boolean;
  aspectRatio?: 'square' | '4/3' | '16/9';
  fallbackIcon?: React.ReactNode;
}

/**
 * Componente de galeria de imagens com navegacao e indicadores
 * Usado nos cards de listagem - sem zoom, sem bordas, imagem preenchendo todo espaco
 */
export default function ImageGallery({
  images,
  productName,
  className = '',
  showIndicators = true,
  showArrows = true,
  aspectRatio = 'square',
  fallbackIcon,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Encontra o indice da imagem principal
  useEffect(() => {
    const principalIndex = images.findIndex(img => img.principal);
    if (principalIndex !== -1) {
      setCurrentIndex(principalIndex);
    }
  }, [images]);

  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentIndex];

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToImage = useCallback((index: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex(index);
  }, []);

  // Suporte a swipe em mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }

    setTouchStart(null);
  };

  // Navegacao por teclado quando hover
  useEffect(() => {
    if (!isHovered || !hasMultipleImages) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, hasMultipleImages, nextImage, prevImage]);

  const aspectClasses = {
    square: 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
  };

  // Sem imagens - mostra fallback
  if (images.length === 0) {
    return (
      <div className={`${aspectClasses[aspectRatio]} relative overflow-hidden bg-white ${className}`}>
        <div className="flex items-center justify-center h-full">
          {fallbackIcon || (
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${aspectClasses[aspectRatio]} relative overflow-hidden group bg-white ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Imagem ocupando o maximo do espaco com fundo branco */}
      <div className="relative w-full h-full overflow-hidden">
        <Image
          src={currentImage.url}
          alt={`${productName}${hasMultipleImages ? ` - ${currentIndex + 1}/${images.length}` : ''}`}
          fill
          className="object-contain p-1"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      </div>

      {/* Setas de navegacao */}
      {hasMultipleImages && showArrows && (
        <>
          {/* Seta esquerda */}
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 sm:p-2 rounded-full
                       opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer
                       hover:bg-black/70 hover:scale-110 z-10
                       focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Imagem anterior"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Seta direita */}
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 sm:p-2 rounded-full
                       opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer
                       hover:bg-black/70 hover:scale-110 z-10
                       focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Proxima imagem"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indicadores (dots) */}
      {hasMultipleImages && showIndicators && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToImage(index, e)}
              className={`w-2 h-2 rounded-full transition-all duration-200
                         ${index === currentIndex
                           ? 'bg-white scale-110'
                           : 'bg-white/50 hover:bg-white/75'}`}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Badge de quantidade de imagens */}
      {hasMultipleImages && (
        <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10
                        opacity-0 group-hover:opacity-100 transition-opacity">
          {currentIndex + 1}/{images.length}
        </span>
      )}
    </div>
  );
}

/**
 * Versao compacta para uso em cards de listagem
 * Sem zoom, sem bordas, imagem preenchendo todo o espaco
 */
export function ImageGalleryCompact({
  images,
  productName,
  className = '',
}: {
  images: GalleryImage[];
  productName: string;
  className?: string;
}) {
  return (
    <ImageGallery
      images={images}
      productName={productName}
      className={className}
      showIndicators={images.length <= 5}
      showArrows={true}
      aspectRatio="square"
    />
  );
}

/**
 * Versao para pagina de detalhes com galeria completa
 * Com zoom tipo lupa/magnifier, setas de navegacao, sem bordas
 */
export function ImageGalleryFull({
  images,
  productName,
  className = '',
}: {
  images: GalleryImage[];
  productName: string;
  className?: string;
}) {
  const [mainIndex, setMainIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const hasMultipleImages = images.length > 1;

  // Encontra a imagem principal
  useEffect(() => {
    const principalIndex = images.findIndex(img => img.principal);
    if (principalIndex !== -1) {
      setMainIndex(principalIndex);
    }
  }, [images]);

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setMainIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setMainIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Handler para o efeito de lupa
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Desativar zoom nas bordas laterais (area das setas - 60px de cada lado)
    const edgeMargin = 60;
    if (x < edgeMargin || x > rect.width - edgeMargin) {
      setIsZooming(false);
      return;
    }

    // Reativar zoom se estava desativado
    setIsZooming(true);

    // Calcula a porcentagem da posicao do mouse
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    // Posicao da lupa (centralizada no mouse)
    const lensSize = 150; // tamanho da lupa em pixels
    const lensX = Math.max(0, Math.min(x - lensSize / 2, rect.width - lensSize));
    const lensY = Math.max(0, Math.min(y - lensSize / 2, rect.height - lensSize));

    setZoomPosition({ x: xPercent, y: yPercent });
    setLensPosition({ x: lensX, y: lensY });
  };

  const handleMouseEnter = () => {
    // Zoom sera ativado pelo handleMouseMove quando nao estiver nas bordas
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  if (images.length === 0) {
    return (
      <div className={`aspect-square flex items-center justify-center rounded-lg bg-white ${className}`}>
        <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Imagem principal grande com zoom tipo lupa */}
      <div
        ref={imageContainerRef}
        className="aspect-square relative overflow-hidden group cursor-crosshair rounded-lg bg-white"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={images[mainIndex].url}
          alt={productName}
          fill
          className="object-contain p-2"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Lupa/Magnifier - aparece no hover */}
        {isZooming && (
          <div
            className="absolute w-[180px] h-[180px] border-2 border-white shadow-xl overflow-hidden pointer-events-none z-20 bg-white"
            style={{
              left: lensPosition.x,
              top: lensPosition.y,
              borderRadius: '50%',
            }}
          >
            <div
              className="absolute w-[350%] h-[350%]"
              style={{
                backgroundImage: `url(${images[mainIndex].url})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                left: '-125%',
                top: '-125%',
              }}
            />
          </div>
        )}

        {/* Setas de navegacao na imagem grande */}
        {hasMultipleImages && (
          <>
            {/* Seta esquerda */}
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 sm:p-3 rounded-full
                         opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer
                         hover:bg-black/70 hover:scale-110 z-10
                         focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Imagem anterior"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Seta direita */}
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 sm:p-3 rounded-full
                         opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer
                         hover:bg-black/70 hover:scale-110 z-10
                         focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Proxima imagem"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Badge de contagem */}
            <span className="absolute top-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full z-10
                            opacity-0 group-hover:opacity-100 transition-opacity">
              {mainIndex + 1}/{images.length}
            </span>
          </>
        )}

        {/* Indicador de zoom */}
        {!isZooming && (
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10
                          opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            Passe o mouse para zoom
          </div>
        )}
      </div>

      {/* Miniaturas com fundo branco e imagem completa */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => setMainIndex(index)}
              className={`flex-shrink-0 w-20 h-20 relative overflow-hidden transition-all rounded-md bg-white
                         ${index === mainIndex
                           ? 'ring-2 ring-medical ring-offset-1'
                           : 'opacity-70 hover:opacity-100'}`}
            >
              <Image
                src={image.url}
                alt={`${productName} - miniatura ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
