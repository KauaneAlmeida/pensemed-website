'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';
import { ImageGalleryFull, GalleryImage } from '@/components/ImageGallery';
import { getProductImages } from '@/hooks/useProductImages';

export interface VariacaoEquipamento {
  id: number;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  imagem_url: string | null;
  variacaoTexto: string;
  tipoVariacao: 'numero' | 'medida' | null;
}

interface EquipamentoDetalhesProps {
  equipamento: {
    id: number;
    nome: string;
    codigo: string | null;
    descricao: string | null;
    imagem_url: string | null;
  };
  variacoes: VariacaoEquipamento[];
  nomeExibicao: string;
  categoriaSlug: string;
  descricaoCompleta: string;
  mostrarCodigo: boolean;
  nomeTabela?: string;
}

export default function EquipamentoDetalhes({
  equipamento,
  variacoes,
  nomeExibicao,
  categoriaSlug,
  descricaoCompleta,
  mostrarCodigo,
  nomeTabela,
}: EquipamentoDetalhesProps) {
  const router = useRouter();
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<VariacaoEquipamento | null>(
    variacoes.find(v => v.id === equipamento.id) || null
  );
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  // Buscar imagens do produto da tabela de imagens
  useEffect(() => {
    const fetchImages = async () => {
      if (!nomeTabela) {
        setLoadingImages(false);
        return;
      }

      const productId = variacaoSelecionada?.id || equipamento.id;

      try {
        const { data, error } = await getProductImages(productId, nomeTabela);
        if (!error && data && data.length > 0) {
          setImages(data.map(img => ({
            id: img.id,
            url: img.url,
            ordem: img.ordem,
            principal: img.principal,
          })));
        } else {
          // Fallback para imagem_url do equipamento
          const fallbackUrl = variacaoSelecionada?.imagem_url || equipamento.imagem_url;
          if (fallbackUrl) {
            setImages([{ url: fallbackUrl, principal: true }]);
          } else {
            setImages([]);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar imagens:', err);
        const fallbackUrl = variacaoSelecionada?.imagem_url || equipamento.imagem_url;
        if (fallbackUrl) {
          setImages([{ url: fallbackUrl, principal: true }]);
        }
      }

      setLoadingImages(false);
    };

    fetchImages();
  }, [equipamento.id, equipamento.imagem_url, variacaoSelecionada, nomeTabela]);

  // Dados a exibir (da variação selecionada ou do equipamento original)
  const dadosExibicao = variacaoSelecionada || {
    id: equipamento.id,
    nome: equipamento.nome,
    codigo: equipamento.codigo,
    descricao: equipamento.descricao,
    imagem_url: equipamento.imagem_url,
    variacaoTexto: '',
    tipoVariacao: null,
  };

  // Extrair nome base (sem variação) para exibição
  const nomeBase = variacoes.length > 1
    ? equipamento.nome.replace(/\s*(Nº?\s*\d+|N[°º]?\s*\d+|#\d+|\s+\d+|\d+(?:[.,]\d+)?\s*(mm|cm|m|"|'|pol|polegadas?))$/i, '').trim()
    : equipamento.nome;

  const handleVariacaoClick = (variacao: VariacaoEquipamento) => {
    setVariacaoSelecionada(variacao);
    // Navegar para a URL da variação (soft navigation)
    router.push(`/equipamentos-medicos/${categoriaSlug}/${variacao.id}`, { scroll: false });
  };

  // WhatsApp message com a variação selecionada
  const codigoMsg = dadosExibicao.codigo && dadosExibicao.codigo.length < 20
    ? `${dadosExibicao.codigo} - `
    : '';
  const variacaoMsg = variacaoSelecionada?.variacaoTexto
    ? ` (${variacaoSelecionada.variacaoTexto})`
    : '';
  const whatsappMessage = `Olá! Gostaria de informações sobre o equipamento ${codigoMsg}${nomeBase}${variacaoMsg} da categoria ${nomeExibicao}`;
  const whatsappUrl = `https://wa.me/5519992660303?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-visible">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        {/* Galeria de Imagens */}
        <div className="p-3 sm:p-4 lg:p-6">
          {loadingImages ? (
            <div className="aspect-square flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ImageGalleryFull
              images={images}
              productName={dadosExibicao.nome}
            />
          )}
        </div>

        {/* Informações */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Código - só mostra se for válido */}
          {mostrarCodigo && dadosExibicao.codigo && dadosExibicao.codigo.length < 20 && (
            <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-50 text-emerald-700 rounded-lg font-semibold mb-4 text-sm sm:text-base">
              Código: {dadosExibicao.codigo}
            </div>
          )}

          {/* Título - Nome base do equipamento */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 break-words">
            {nomeBase}
          </h1>

          {/* Subtítulo - Categoria */}
          <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
            {nomeExibicao}
          </p>

          {/* SELETOR DE VARIAÇÕES */}
          {variacoes.length > 1 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                Selecione a variação:
              </h2>
              <div className="flex flex-wrap gap-2">
                {variacoes.map((variacao) => (
                  <button
                    key={variacao.id}
                    onClick={() => handleVariacaoClick(variacao)}
                    className={`
                      px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border-2 font-medium transition-all duration-200 text-sm sm:text-base
                      ${variacaoSelecionada?.id === variacao.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                      }
                    `}
                  >
                    {variacao.variacaoTexto}
                  </button>
                ))}
              </div>

              {/* Info da variação selecionada */}
              {variacaoSelecionada && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Variação selecionada:</span>{' '}
                    <span className="text-emerald-600 font-semibold">{variacaoSelecionada.variacaoTexto}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Descrição */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Descrição</h2>
            <div className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
              {dadosExibicao.descricao || descricaoCompleta}
            </div>
          </div>

          {/* Disponibilidade */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold text-green-900 text-sm sm:text-base">
                  Disponível para locação
                </p>
                <p className="text-xs sm:text-sm text-green-700">
                  Entre em contato para verificar disponibilidade
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <WhatsAppButton
              href={whatsappUrl}
              label="Solicitar Informações via WhatsApp"
              className="w-full text-center justify-center"
            />

            <Link
              href="/equipamentos-medicos"
              className="w-full text-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
            >
              Voltar para Equipamentos Médicos
            </Link>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
              Informações Importantes
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Equipamento de última geração</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Manutenção preventiva em dia</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Suporte técnico especializado</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
