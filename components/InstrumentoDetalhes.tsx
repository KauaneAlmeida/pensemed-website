'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';
import { ImageGalleryFull, GalleryImage } from '@/components/ImageGallery';
import { getProductImages } from '@/hooks/useProductImages';

export interface Variacao {
  id: number;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  imagem_url: string | null;
  variacaoTexto: string;
  tipoVariacao: 'numero' | 'medida' | null;
}

interface InstrumentoDetalhesProps {
  instrumento: {
    id: number;
    nome: string;
    codigo: string | null;
    descricao: string | null;
    imagem_url: string | null;
  };
  variacoes: Variacao[];
  nomeExibicao: string;
  categoriaSlug: string;
  descricaoCompleta: string;
  mostrarCodigo: boolean;
  nomeTabela?: string;
}

// Tipo para as tabs
type TabType = 'detalhes' | 'especificacoes';

export default function InstrumentoDetalhes({
  instrumento,
  variacoes,
  nomeExibicao,
  categoriaSlug,
  descricaoCompleta,
  mostrarCodigo,
  nomeTabela,
}: InstrumentoDetalhesProps) {
  const router = useRouter();
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<Variacao | null>(
    variacoes.find(v => v.id === instrumento.id) || null
  );
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('detalhes');

  // Buscar imagens do produto da tabela de imagens
  useEffect(() => {
    const fetchImages = async () => {
      if (!nomeTabela) {
        setLoadingImages(false);
        return;
      }

      // Algumas tabelas não têm coluna id, então usa 0 como placeholder
      // A busca será feita pelo nome/slug quando disponível
      let productId = variacaoSelecionada?.id || instrumento.id;
      if (!productId || (typeof productId === 'number' && isNaN(productId))) {
        productId = 0;
      }
      const productName = variacaoSelecionada?.nome || instrumento.nome;

      try {
        const { data, error } = await getProductImages(productId, nomeTabela, productName);
        if (!error && data && data.length > 0) {
          setImages(data.map(img => ({
            id: img.id,
            url: img.url,
            ordem: img.ordem,
            principal: img.principal,
          })));
        } else {
          const fallbackUrl = variacaoSelecionada?.imagem_url || instrumento.imagem_url;
          if (fallbackUrl) {
            setImages([{ url: fallbackUrl, principal: true }]);
          } else {
            setImages([]);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar imagens:', err);
        const fallbackUrl = variacaoSelecionada?.imagem_url || instrumento.imagem_url;
        if (fallbackUrl) {
          setImages([{ url: fallbackUrl, principal: true }]);
        }
      }

      setLoadingImages(false);
    };

    fetchImages();
  }, [instrumento.id, instrumento.imagem_url, instrumento.nome, variacaoSelecionada, nomeTabela]);

  // Dados a exibir (da variação selecionada ou do instrumento original)
  const dadosExibicao = variacaoSelecionada || {
    id: instrumento.id,
    nome: instrumento.nome,
    codigo: instrumento.codigo,
    descricao: instrumento.descricao,
    imagem_url: instrumento.imagem_url,
    variacaoTexto: '',
    tipoVariacao: null,
  };

  // Extrair nome base (sem variação) para exibição
  const nomeBase = variacoes.length > 1
    ? instrumento.nome.replace(/\s*(Nº?\s*\d+|N[°º]?\s*\d+|#\d+|\s+\d+|\d+(?:[.,]\d+)?\s*(mm|cm|m|"|'|pol|polegadas?))$/i, '').trim()
    : instrumento.nome;

  const handleVariacaoClick = (variacao: Variacao) => {
    setVariacaoSelecionada(variacao);
    router.replace(`/instrumentacao-cme/${categoriaSlug}/${variacao.id}`, { scroll: false });
  };

  // WhatsApp message com a variação selecionada
  const codigoMsg = dadosExibicao.codigo && dadosExibicao.codigo.length < 20
    ? `${dadosExibicao.codigo} - `
    : '';
  const variacaoMsg = variacaoSelecionada?.variacaoTexto
    ? ` (${variacaoSelecionada.variacaoTexto})`
    : '';
  const whatsappMessage = `Olá! Gostaria de informações sobre o instrumento ${codigoMsg}${nomeBase}${variacaoMsg} da ${nomeExibicao}`;
  const whatsappUrl = `https://wa.me/5511940201088?text=${encodeURIComponent(whatsappMessage)}`;

  // Specs rápidas
  const quickSpecs = [
    mostrarCodigo && dadosExibicao.codigo && dadosExibicao.codigo.length < 20 && {
      icon: 'tag',
      label: 'Código',
      value: dadosExibicao.codigo
    },
    { icon: 'folder', label: 'Categoria', value: nomeExibicao },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  // Ícones para specs
  const SpecIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'tag':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'folder':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Verifica se tem conteúdo para tabs
  const hasDescricao = dadosExibicao.descricao || descricaoCompleta;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

      {/* ========== COLUNA ESQUERDA: APENAS IMAGEM ========== */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        {loadingImages ? (
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse rounded-2xl" />
        ) : images.length > 0 ? (
          <ImageGalleryFull
            images={images}
            productName={dadosExibicao.nome}
          />
        ) : (
          <div className="aspect-square relative bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center rounded-2xl">
            <svg
              className="w-24 h-24 text-gray-300 mb-4"
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
            <p className="text-gray-400 text-sm">Imagem não disponível</p>
          </div>
        )}
      </div>

      {/* ========== COLUNA DIREITA: INFORMAÇÕES ========== */}
      <div className="flex flex-col">

        {/* Badge de categoria (discreto) */}
        <span className="inline-flex self-start px-3 py-1 bg-[#205b67]/10 text-[#205b67] rounded-full text-xs font-medium mb-4">
          {nomeExibicao}
        </span>

        {/* Nome do produto */}
        <h1 className="text-2xl sm:text-3xl lg:text-[28px] font-bold text-gray-900 leading-tight mb-2">
          {nomeBase}
        </h1>

        {/* Subtítulo: Instrumentação CME • Categoria */}
        <p className="text-sm text-gray-500 mb-6">
          Instrumentação CME • {nomeExibicao}
        </p>

        {/* SELETOR DE VARIAÇÕES */}
        {variacoes.length > 1 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Selecione a variação:
            </p>
            <div className="flex flex-wrap gap-2">
              {variacoes.map((variacao) => (
                <button
                  key={variacao.id}
                  onClick={() => handleVariacaoClick(variacao)}
                  className={`
                    px-3 py-1.5 rounded-lg border font-medium transition-all duration-200 text-sm
                    ${variacaoSelecionada?.id === variacao.id
                      ? 'border-[#205b67] bg-[#205b67]/10 text-[#205b67]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }
                  `}
                >
                  {variacao.variacaoTexto}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Descrição curta (resumo) */}
        {hasDescricao && (
          <p className="text-[15px] text-gray-600 leading-relaxed mb-6 line-clamp-3">
            {dadosExibicao.descricao || descricaoCompleta}
          </p>
        )}

        {/* Especificações Rápidas - Grid compacto */}
        {quickSpecs.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 pb-8 border-b border-gray-100">
            {quickSpecs.map((spec, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <SpecIcon type={spec.icon} />
                <span className="text-gray-500">{spec.label}:</span>
                <span className="font-medium text-gray-900">{spec.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Disponibilidade */}
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl mb-6">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-900 text-sm">Disponível para locação</p>
            <p className="text-xs text-green-700">Entre em contato para verificar</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <WhatsAppButton
            href={whatsappUrl}
            label="Solicitar Informações via WhatsApp"
            className="w-full text-center justify-center py-3.5"
          />
          <Link
            href={`/instrumentacao-cme/${categoriaSlug}`}
            className="w-full text-center px-6 py-3 text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-colors text-sm"
          >
            Voltar para {nomeExibicao}
          </Link>
        </div>

        {/* ========== TABS DE INFORMAÇÕES DETALHADAS ========== */}
        {hasDescricao && (
          <div className="mt-10 pt-10 border-t border-gray-100">

            {/* Tab Headers */}
            <div className="flex gap-1 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('detalhes')}
                className={`px-5 py-3 text-sm font-medium transition-colors relative
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
                onClick={() => setActiveTab('especificacoes')}
                className={`px-5 py-3 text-sm font-medium transition-colors relative
                  ${activeTab === 'especificacoes'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                Informações
                {activeTab === 'especificacoes' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div>

              {/* Tab: Detalhes */}
              {activeTab === 'detalhes' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Descrição</h3>
                    <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                      {dadosExibicao.descricao || descricaoCompleta}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Informações */}
              {activeTab === 'especificacoes' && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Informações Importantes</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Processamento em CME certificado</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Instrumentais esterilizados e prontos para uso</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
  );
}
