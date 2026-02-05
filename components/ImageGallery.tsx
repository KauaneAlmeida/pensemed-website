'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

function ImageFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center h-full w-full bg-gray-50 ${className}`}>
      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

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
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

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
        {failedUrls.has(currentImage.url) ? (
          <ImageFallback />
        ) : (
          <Image
            src={currentImage.url}
            alt={`${productName}${hasMultipleImages ? ` - ${currentIndex + 1}/${images.length}` : ''}`}
            fill
            className="object-contain p-1"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            onError={() => setFailedUrls(prev => new Set(prev).add(currentImage.url))}
          />
        )}
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
 * Otimizado para mobile com swipe e setas sempre visiveis
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
  const [showZoomPanel, setShowZoomPanel] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const hasMultipleImages = images.length > 1;

  // Configuracoes do zoom
  const zoomLevel = 2.5; // Nivel de ampliacao

  // Encontra a imagem principal
  useEffect(() => {
    const principalIndex = images.findIndex(img => img.principal);
    if (principalIndex !== -1) {
      setMainIndex(principalIndex);
    }
  }, [images]);

  const nextImage = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setMainIndex(prev => (prev + 1) % images.length);
    setShowZoomPanel(false);
  }, [images.length]);

  const prevImage = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setMainIndex(prev => (prev - 1 + images.length) % images.length);
    setShowZoomPanel(false);
  }, [images.length]);

  // Suporte a swipe em mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || !hasMultipleImages) return;

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

  // Handler para o efeito de zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Desativar zoom nas bordas laterais (area das setas)
    const edgeMargin = 50;
    if (x < edgeMargin || x > rect.width - edgeMargin) {
      setShowZoomPanel(false);
      return;
    }

    setShowZoomPanel(true);

    // Calcula a porcentagem da posicao do mouse (0-100)
    const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

    setZoomPosition({ x: xPercent, y: yPercent });
  };

  const handleMouseLeave = () => {
    setShowZoomPanel(false);
  };

  if (images.length === 0) {
    return (
      <div className={`aspect-square flex items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      {/* Container principal - posicao relativa para o painel de zoom */}
      <div className="relative">
        {/* Imagem principal */}
        <div
          ref={imageContainerRef}
          className="aspect-square relative overflow-hidden group md:cursor-crosshair rounded-xl sm:rounded-2xl bg-white"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {failedUrls.has(images[mainIndex].url) ? (
            <ImageFallback className="rounded-xl sm:rounded-2xl" />
          ) : (
            <Image
              src={images[mainIndex].url}
              alt={productName}
              fill
              className="object-contain p-3 sm:p-4"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => setFailedUrls(prev => new Set(prev).add(images[mainIndex].url))}
            />
          )}

          {/* Setas de navegacao na imagem grande */}
          {hasMultipleImages && (
            <>
              {/* Seta esquerda - sempre visivel no mobile */}
              <button
                onClick={prevImage}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-black/40 sm:bg-black/50 text-white p-2 sm:p-3 rounded-full
                           opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 cursor-pointer
                           hover:bg-black/70 active:scale-95 sm:hover:scale-110 z-20
                           focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Imagem anterior"
              >
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Seta direita - sempre visivel no mobile */}
              <button
                onClick={nextImage}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-black/40 sm:bg-black/50 text-white p-2 sm:p-3 rounded-full
                           opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 cursor-pointer
                           hover:bg-black/70 active:scale-95 sm:hover:scale-110 z-20
                           focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Proxima imagem"
              >
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Indicador de posicao - sempre visivel */}
              <span className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/60 text-white text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full z-10">
                {mainIndex + 1}/{images.length}
              </span>

              {/* Indicadores (dots) para mobile */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden z-10">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setMainIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200
                               ${index === mainIndex
                                 ? 'bg-white scale-110'
                                 : 'bg-white/50'}`}
                    aria-label={`Ir para imagem ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Indicador de zoom - desktop only */}
          {!showZoomPanel && (
            <div className="hidden md:flex absolute bottom-4 left-4 bg-black/70 text-white text-sm px-3 py-2 rounded-lg z-10
                            opacity-0 group-hover:opacity-100 transition-opacity items-center gap-2 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              Passe o mouse para ampliar
            </div>
          )}
        </div>

        {/* Lupa circular que segue o mouse */}
        {showZoomPanel && (
          <div
            className="hidden md:block absolute w-[200px] h-[200px] rounded-full overflow-hidden bg-white border-4 border-white shadow-2xl z-30 pointer-events-none"
            style={{
              left: `calc(${zoomPosition.x}% - 100px)`,
              top: `calc(${zoomPosition.y}% - 100px)`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${images[mainIndex].url})`,
                backgroundSize: `${zoomLevel * 100}%`,
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        )}
      </div>

      {/* Miniaturas com indicador de selecao embaixo - escondidas no mobile, mostradas no desktop */}
      {images.length > 1 && (
        <div className="hidden sm:flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => {
                setMainIndex(index);
                setShowZoomPanel(false);
              }}
              className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 relative overflow-hidden transition-all rounded-lg bg-white
                         ${index === mainIndex
                           ? 'opacity-100 ring-2 ring-[#09354d]'
                           : 'opacity-60 hover:opacity-90'}`}
            >
              {failedUrls.has(image.url) ? (
                <ImageFallback />
              ) : (
                <Image
                  src={image.url}
                  alt={`${productName} - miniatura ${index + 1}`}
                  fill
                  className="object-contain p-1"
                  sizes="80px"
                  onError={() => setFailedUrls(prev => new Set(prev).add(image.url))}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
