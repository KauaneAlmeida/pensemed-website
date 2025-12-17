'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';

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
}

export default function EquipamentoDetalhes({
  equipamento,
  variacoes,
  nomeExibicao,
  categoriaSlug,
  descricaoCompleta,
  mostrarCodigo,
}: EquipamentoDetalhesProps) {
  const router = useRouter();
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<VariacaoEquipamento | null>(
    variacoes.find(v => v.id === equipamento.id) || null
  );

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
  const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagem */}
        <div className="relative bg-gray-100 min-h-[400px] lg:min-h-[600px]">
          {dadosExibicao.imagem_url ? (
            <Image
              src={dadosExibicao.imagem_url}
              alt={dadosExibicao.nome}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-200">
              <svg
                className="w-32 h-32 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500 text-lg">Imagem não disponível</p>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="p-8">
          {/* Código - só mostra se for válido */}
          {mostrarCodigo && dadosExibicao.codigo && dadosExibicao.codigo.length < 20 && (
            <div className="inline-block px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-semibold mb-4">
              Código: {dadosExibicao.codigo}
            </div>
          )}

          {/* Título - Nome base do equipamento */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {nomeBase}
          </h1>

          {/* Subtítulo - Categoria */}
          <p className="text-lg text-gray-600 mb-6">
            {nomeExibicao}
          </p>

          {/* SELETOR DE VARIAÇÕES */}
          {variacoes.length > 1 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Selecione a variação:
              </h2>
              <div className="flex flex-wrap gap-2">
                {variacoes.map((variacao) => (
                  <button
                    key={variacao.id}
                    onClick={() => handleVariacaoClick(variacao)}
                    className={`
                      px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200
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
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Descrição</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {dadosExibicao.descricao || descricaoCompleta}
            </div>
          </div>

          {/* Disponibilidade */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-green-600"
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
                <p className="font-semibold text-green-900">
                  Disponível para locação
                </p>
                <p className="text-sm text-green-700">
                  Entre em contato para verificar disponibilidade
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col gap-4">
            <WhatsAppButton
              href={whatsappUrl}
              label="Solicitar Informações via WhatsApp"
              className="w-full text-center justify-center"
            />

            <Link
              href={`/equipamentos-medicos/${categoriaSlug}`}
              className="w-full text-center px-6 py-3 bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg font-semibold transition-colors duration-200"
            >
              Voltar para {nomeExibicao}
            </Link>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
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
