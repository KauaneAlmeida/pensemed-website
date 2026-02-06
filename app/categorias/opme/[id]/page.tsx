'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProdutoOPME } from '@/lib/types';
import WhatsAppButton from '@/components/WhatsAppButton';
import { ImageGalleryFull, GalleryImage } from '@/components/ImageGallery';
import { getOPMEProductImages, OPMEImage } from '@/hooks/useProductImages';

// Card de produto relacionado - imagem pré-carregada server-side
function ProdutoRelacionadoCard({ produto }: { produto: ProdutoOPME & { imagem_principal?: string | null } }) {
  const imagemUrl = produto.imagem_principal || null;

  return (
    <Link
      href={`/categorias/opme/${produto.id}`}
      className="group bg-white rounded-xl border border-gray-100 hover:border-[#09354d]/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Imagem */}
      <div className="aspect-square relative overflow-hidden bg-white">
        {imagemUrl ? (
          <Image
            src={imagemUrl}
            alt={produto.nome}
            fill
            className="object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <Image
            src="/images/placeholder-produto.svg"
            alt={produto.nome}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        )}

        {/* Badge categoria */}
        {produto.categoria && (
          <div className="absolute top-2 left-2">
            <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-[#09354d]/10 text-[#09354d]">
              {produto.categoria}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2 mb-1 sm:mb-2 group-hover:text-[#09354d] transition-colors">
          {produto.nome}
        </h3>
        <div className="flex items-center text-[#09354d] text-[10px] sm:text-xs font-medium">
          <span>Ver detalhes</span>
          <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// Componente de loading
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white pt-20 sm:pt-24">
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse"></div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="space-y-6">
            <div className="h-6 bg-gray-100 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse"></div>
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tipo para as tabs
type TabType = 'detalhes' | 'informacoes';

export default function OPMEDetailPage({
  params
}: {
  params: { id: string }
}) {
  const [produto, setProduto] = useState<ProdutoOPME | null>(null);
  const [produtosRelacionados, setProdutosRelacionados] = useState<ProdutoOPME[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('detalhes');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar produto
        const response = await fetch(`/api/opme/${params.id}`);
        if (!response.ok) {
          throw new Error('Produto não encontrado');
        }
        const data = await response.json();
        setProduto(data);

        // Usar imagens pré-carregadas do servidor (se disponíveis)
        const imagesData = data.preloadedImages || [];
        if (imagesData.length > 0) {
          // Remover duplicatas: manter apenas uma imagem por ordem (a mais recente)
          const imagensPorOrdem = new Map<number, any>();
          imagesData.forEach((img: any) => {
            const existente = imagensPorOrdem.get(img.ordem);
            if (!existente || img.id > existente.id) {
              imagensPorOrdem.set(img.ordem, img);
            }
          });

          const imagensUnicas = Array.from(imagensPorOrdem.values())
            .sort((a: any, b: any) => a.ordem - b.ordem)
            .slice(0, 2);

          setImages(imagensUnicas.map((img: any) => ({
            id: String(img.id),
            url: img.url,
            ordem: img.ordem,
            principal: img.ordem === 0,
          })));
        } else {
          // Fallback: buscar imagens client-side se não vieram pré-carregadas
          const productId = parseInt(params.id, 10);
          const { data: clientImagesData } = await getOPMEProductImages(productId);
          if (clientImagesData && clientImagesData.length > 0) {
            const imagensPorOrdem = new Map<number, typeof clientImagesData[0]>();
            clientImagesData.forEach(img => {
              const existente = imagensPorOrdem.get(img.ordem);
              if (!existente || img.id > existente.id) {
                imagensPorOrdem.set(img.ordem, img);
              }
            });

            const imagensUnicas = Array.from(imagensPorOrdem.values())
              .sort((a, b) => a.ordem - b.ordem)
              .slice(0, 2);

            setImages(imagensUnicas.map(img => ({
              id: String(img.id),
              url: img.url,
              ordem: img.ordem,
              principal: img.ordem === 0,
            })));
          }
        }
        setLoadingImages(false);

        // Buscar produtos relacionados (mesma categoria)
        if (data.categoria) {
          const relResponse = await fetch(`/api/opme?categoria=${encodeURIComponent(data.categoria)}&porPagina=5`);
          if (relResponse.ok) {
            const relData = await relResponse.json();
            // Filtrar o produto atual
            const relacionados = (relData.produtos || []).filter(
              (p: ProdutoOPME) => p.id !== data.id
            ).slice(0, 4);
            setProdutosRelacionados(relacionados);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produto');
        setLoadingImages(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !produto) {
    return (
      <div className="min-h-screen bg-white pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h1>
            <p className="text-gray-600 mb-6">O produto que você está procurando não existe ou foi removido.</p>
            <Link
              href="/categorias/opme"
              className="inline-flex items-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para OPME
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Gerar mensagem para WhatsApp
  const whatsappMessage = `Olá! Gostaria de informações sobre o produto OPME: ${produto.nome}${produto.categoria ? ` (${produto.categoria})` : ''}${produto.registro_anvisa ? ` - ANVISA: ${produto.registro_anvisa}` : ''}`;
  const whatsappUrl = `https://wa.me/5511940201088?text=${encodeURIComponent(whatsappMessage)}`;

  // Verifica se tem conteúdo para detalhes (descrição, aplicação, especificações, etc.)
  const hasDescricaoOuAplicacao = produto.descricao || produto.aplicacao || produto.especificacoes_tecnicas || produto.modelos || produto.caracteristicas || produto.compatibilidade;

  // Specs rápidas para exibição compacta
  const quickSpecs = [
    produto.fabricante && { icon: 'building', label: 'Fabricante', value: produto.fabricante },
    produto.registro_anvisa && { icon: 'shield', label: 'ANVISA', value: produto.registro_anvisa },
    produto.uso_unico !== null && produto.uso_unico !== undefined && {
      icon: 'info',
      label: 'Uso',
      value: produto.uso_unico ? 'Descartável' : 'Reutilizável'
    },
    produto.esterilizacao && { icon: 'check', label: 'Esterilização', value: produto.esterilizacao },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  // Ícones para specs
  const SpecIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'building':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'shield':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'check':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white pt-20 sm:pt-24">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm sm:text-base text-gray-500">
            <Link href="/" className="hover:text-gray-700 transition-colors">
              Início
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/categorias/opme" className="hover:text-gray-700 transition-colors">
              OPME
            </Link>
            {produto.categoria && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-gray-600 font-medium truncate max-w-[200px] sm:max-w-[300px]">{produto.categoria}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">

        {/* Grid principal: imagem maior, info menor */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[1.3fr_1fr] gap-6 sm:gap-8 lg:gap-12">

          {/* ========== COLUNA ESQUERDA: GALERIA DE IMAGENS ========== */}
          <div className="lg:sticky lg:top-28 lg:self-start w-full max-w-none">
            {loadingImages ? (
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse rounded-xl sm:rounded-2xl" />
            ) : images.length > 0 ? (
              <ImageGalleryFull
                images={images}
                productName={produto.nome}
              />
            ) : (
              <div className="aspect-square relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl overflow-hidden flex flex-col items-center justify-center">
                <svg
                  className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300 mb-3 sm:mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
                <p className="text-gray-400 text-xs sm:text-sm">Imagem não disponível</p>
              </div>
            )}
          </div>

          {/* ========== COLUNA DIREITA: INFORMAÇÕES ========== */}
          <div className="flex flex-col">

            {/* Badge de categoria (discreto) */}
            {produto.categoria && (
              <span className="inline-flex self-start px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium mb-3 sm:mb-4 bg-[#09354d]/10 text-[#09354d]">
                {produto.categoria}
              </span>
            )}

            {/* Nome do produto */}
            <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-gray-900 leading-tight mb-1.5 sm:mb-2">
              {produto.nome}
            </h1>

            {/* Subtítulo: OPME • Categoria */}
            <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
              OPME{produto.categoria ? ` • ${produto.categoria}` : ''}
            </p>

            {/* Descrição curta (resumo) */}
            {produto.descricao && (
              <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed mb-4 sm:mb-6 line-clamp-3">
                {produto.descricao}
              </p>
            )}

            {/* Especificações Rápidas - Grid compacto */}
            {quickSpecs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-4 sm:gap-y-3 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-100">
                {quickSpecs.map((spec, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                    <SpecIcon type={spec.icon} />
                    <span className="text-gray-500">{spec.label}:</span>
                    <span className="font-medium text-gray-900 truncate">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Disponibilidade */}
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 bg-green-50">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-green-100">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm text-green-800">Disponível para locação</p>
                <p className="text-[10px] sm:text-xs text-green-600">Entre em contato para verificar</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <WhatsAppButton
                href={whatsappUrl}
                label="Solicitar Orçamento via WhatsApp"
                className="w-full text-center justify-center py-3 sm:py-3.5 text-sm sm:text-base"
              />
              <Link
                href="/categorias/opme"
                className="w-full text-center px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                Voltar para OPME
              </Link>
            </div>

            {/* ========== TABS DE INFORMAÇÕES DETALHADAS (dentro da coluna direita, igual ao CME) ========== */}
            {hasDescricaoOuAplicacao && (
              <div className="mt-6 sm:mt-10 pt-6 sm:pt-10 border-t border-gray-100">

                {/* Tab Headers */}
                <div className="flex gap-1 border-b border-gray-200 mb-4 sm:mb-6">
                  <button
                    onClick={() => setActiveTab('detalhes')}
                    className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors relative
                      ${activeTab === 'detalhes'
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Detalhes
                    {activeTab === 'detalhes' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('informacoes')}
                    className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors relative
                      ${activeTab === 'informacoes'
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Informações
                    {activeTab === 'informacoes' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div>

                  {/* Tab: Detalhes */}
                  {activeTab === 'detalhes' && (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Descrição</h3>
                        <p className="text-xs sm:text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                          {produto.descricao || produto.aplicacao || 'Produto OPME de alta qualidade para procedimentos cirúrgicos.'}
                        </p>
                      </div>
                      {produto.aplicacao && produto.aplicacao !== produto.descricao && (
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Aplicação</h3>
                          <p className="text-xs sm:text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                            {produto.aplicacao}
                          </p>
                        </div>
                      )}
                      {produto.especificacoes_tecnicas && (
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Especificações Técnicas</h3>
                          <p className="text-xs sm:text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                            {produto.especificacoes_tecnicas}
                          </p>
                        </div>
                      )}
                      {produto.modelos && (
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Modelos Disponíveis</h3>
                          <p className="text-xs sm:text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                            {produto.modelos}
                          </p>
                        </div>
                      )}
                      {produto.caracteristicas && (
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Características</h3>
                          <p className="text-xs sm:text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                            {produto.caracteristicas}
                          </p>
                        </div>
                      )}
                      {produto.compatibilidade && (
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Compatibilidade</h3>
                          <p className="text-xs sm:text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                            {produto.compatibilidade}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Informações */}
                  {activeTab === 'informacoes' && (
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Informações Importantes</h3>
                      <ul className="space-y-2 sm:space-y-3">
                        <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Material especial para procedimentos cirúrgicos</span>
                        </li>
                        <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Produtos com registro ANVISA quando aplicável</span>
                        </li>
                        <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Garantia de qualidade e segurança</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Produtos Relacionados */}
      {produtosRelacionados.length > 0 && (
        <div className="bg-gray-50 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
              Produtos Relacionados
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {produtosRelacionados.map((relacionado) => (
                <ProdutoRelacionadoCard
                  key={relacionado.id}
                  produto={relacionado}
                />
              ))}
            </div>

            {/* Botão ver mais */}
            <div className="text-center mt-6 sm:mt-8">
              <Link
                href={`/categorias/opme?categoria=${encodeURIComponent(produto.categoria || '')}`}
                className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 font-medium text-xs sm:text-sm"
              >
                Ver mais produtos desta categoria
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
