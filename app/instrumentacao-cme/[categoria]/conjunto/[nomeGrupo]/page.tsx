'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { InstrumentoCME } from '@/lib/types';

interface ConjuntoPageProps {
  params: {
    categoria: string;
    nomeGrupo: string;
  };
}

interface DadosConjunto {
  nomeBase: string;
  caixaNome: string;
  instrumentos: InstrumentoCME[];
  primeiroNumero: number | null;
  ultimoNumero: number | null;
}

// Função para decodificar base64url no browser
function base64urlDecode(str: string): string {
  // Converter base64url para base64 padrão
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Adicionar padding se necessário
  while (base64.length % 4) {
    base64 += '=';
  }
  // Decodificar
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return str;
  }
}

export default function ConjuntoPage({ params }: ConjuntoPageProps) {
  const [dados, setDados] = useState<DadosConjunto | null>(null);
  const [loading, setLoading] = useState(true);
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<number>(0);

  useEffect(() => {
    async function carregarDados() {
      try {
        // Decodificar parâmetros
        const slugCategoria = decodeURIComponent(params.categoria);
        const slugGrupo = decodeURIComponent(params.nomeGrupo);

        // Decodificar base64url para obter o nome real
        const nomeGrupoDecodificado = base64urlDecode(slugGrupo);
        const nomeTabelaDecodificado = base64urlDecode(slugCategoria);

        // Buscar dados via API
        const response = await fetch(`/api/conjunto?tabela=${encodeURIComponent(nomeTabelaDecodificado)}&grupo=${encodeURIComponent(nomeGrupoDecodificado)}`);

        if (!response.ok) {
          throw new Error('Erro ao carregar dados');
        }

        const data = await response.json();
        setDados(data);
      } catch (error) {
        console.error('Erro ao carregar conjunto:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [params.categoria, params.nomeGrupo]);

  if (loading) {
    return <ConjuntoSkeleton />;
  }

  if (!dados || dados.instrumentos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Conjunto não encontrado</h1>
          <Link href="/instrumentacao-cme" className="text-medical hover:text-medical-dark">
            Voltar para Instrumentação CME
          </Link>
        </div>
      </div>
    );
  }

  const instrumentoAtual = dados.instrumentos[variacaoSelecionada];

  // Extrair variação do nome (suporta Nº, dimensões como "x 50mm", etc.)
  const extrairVariacao = (nome: string): string => {
    // Remover código do início (ASS185 - )
    const nomeSemCodigo = nome.replace(/^[A-Z]{2,4}\d+\s*-\s*/i, '').trim();

    // Padrão 1: Dimensão no final (x 50mm)
    const matchDimensao = nomeSemCodigo.match(/x\s+(\d+)(mm|cm)\s*$/i);
    if (matchDimensao) {
      return `x${matchDimensao[1]}${matchDimensao[2]}`;
    }

    // Padrão 2: Numeração com prefixo (Nº1, N°0000)
    const matchNumeracao = nomeSemCodigo.match(/(Nº|N°|#)\s*(\d+)\s*$/i);
    if (matchNumeracao) {
      return `${matchNumeracao[1]}${matchNumeracao[2]}`;
    }

    // Padrão 3: Número simples no final
    const matchNumero = nomeSemCodigo.match(/\s+(\d+)\s*$/);
    if (matchNumero) {
      return `Nº${matchNumero[1]}`;
    }

    return nome;
  };

  // WhatsApp message com variação selecionada
  const whatsappMessage = `Olá! Gostaria de informações sobre o instrumento ${instrumentoAtual.codigo} - ${instrumentoAtual.nome} da ${dados.caixaNome}`;
  const whatsappUrl = `https://wa.me/5511940201088?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/" className="text-medical hover:text-medical-dark">
              Início
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/instrumentacao-cme" className="text-medical hover:text-medical-dark">
              Instrumentação CME
            </Link>
            <span className="text-gray-400">/</span>
            <Link href={`/instrumentacao-cme/${params.categoria}`} className="text-medical hover:text-medical-dark">
              {dados.caixaNome}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{dados.nomeBase}</span>
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Imagem */}
            <div className="relative bg-gray-100 min-h-[400px] lg:min-h-[600px]">
              {instrumentoAtual.imagem_url ? (
                <Image
                  src={instrumentoAtual.imagem_url}
                  alt={instrumentoAtual.nome}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-medical-light to-gray-200">
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
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">Imagem não disponível</p>
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="p-8">
              {/* Código */}
              <div className="inline-block px-4 py-2 bg-medical-light text-medical rounded-lg font-semibold mb-4">
                Código: {instrumentoAtual.codigo}
              </div>

              {/* Título */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {dados.nomeBase}
              </h1>

              {/* Seletor de Variação */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Selecione a variação:
                </label>
                <div className="flex flex-wrap gap-2">
                  {dados.instrumentos.map((inst, index) => (
                    <button
                      key={inst.id}
                      onClick={() => setVariacaoSelecionada(index)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        variacaoSelecionada === index
                          ? 'bg-medical text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {extrairVariacao(inst.nome)}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {dados.instrumentos.length} variações disponíveis
                  {dados.primeiroNumero !== null && dados.ultimoNumero !== null && (
                    <> (Nº{dados.primeiroNumero} ao Nº{dados.ultimoNumero})</>
                  )}
                </p>
              </div>

              {/* Descrição */}
              {instrumentoAtual.descricao && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Descrição</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {instrumentoAtual.descricao}
                  </p>
                </div>
              )}

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
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Solicitar Informações via WhatsApp
                </a>

                <Link
                  href={`/instrumentacao-cme/${params.categoria}`}
                  className="w-full text-center px-6 py-3 bg-white text-medical border-2 border-medical hover:bg-medical hover:text-white rounded-lg font-semibold transition-colors duration-200"
                >
                  Voltar para {dados.caixaNome}
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
                      className="w-5 h-5 text-medical mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Processamento em CME certificado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-medical mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Instrumentais esterilizados e prontos para uso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-medical mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Garantia de qualidade e segurança</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConjuntoSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image skeleton */}
            <div className="bg-gray-200 min-h-[400px] lg:min-h-[600px] animate-pulse"></div>

            {/* Info skeleton */}
            <div className="p-8">
              <div className="h-8 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-64 mb-6 animate-pulse"></div>

              <div className="mb-8">
                <div className="h-6 bg-gray-200 rounded w-40 mb-3 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded w-16 animate-pulse"></div>
                  ))}
                </div>
              </div>

              <div className="h-24 bg-gray-200 rounded mb-8 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
