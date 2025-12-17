'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getWhatsAppProdutoLink } from '@/lib/whatsapp';
import { agruparInstrumentos, getBadgeVariacoes, InstrumentoAgrupado, codigoValido } from '@/lib/instrumentUtils';

interface Instrumento {
  id: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  imagem_url?: string;
}

interface CaixaCME {
  nome_tabela: string;
  nome_exibicao: string;
  slug: string;
  total_instrumentos: number;
}

// Componente de filtro accordion
function FilterSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-semibold text-gray-900 hover:text-gray-700 transition-colors"
      >
        {title}
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// Componente de busca 100% isolado - gerencia seu próprio estado interno
// e só notifica o pai após o debounce, sem nunca perder foco
function SearchInput({
  initialValue,
  onSearch,
  placeholder = "Buscar...",
  className = "mb-6",
  showClearButton = false,
}: {
  initialValue: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
}) {
  // Estado interno completamente isolado do pai
  const [localValue, setLocalValue] = useState(initialValue);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSubmittedRef = useRef(initialValue);

  // Quando o valor inicial muda externamente (ex: limpar filtros), atualiza o estado local
  // Mas só se for diferente do que já submetemos (evita loops)
  useEffect(() => {
    if (initialValue !== lastSubmittedRef.current) {
      setLocalValue(initialValue);
      lastSubmittedRef.current = initialValue;
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Limpar timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Debounce de 500ms antes de notificar o pai
    timerRef.current = setTimeout(() => {
      lastSubmittedRef.current = newValue;
      onSearch(newValue);
    }, 500);
  };

  const handleClear = () => {
    setLocalValue('');
    lastSubmittedRef.current = '';
    onSearch('');
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className={className}>
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pl-11 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical focus:border-transparent text-base bg-white shadow-sm ${showClearButton && localValue ? 'pr-10' : 'pr-4'}`}
          autoComplete="off"
          spellCheck={false}
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {showClearButton && localValue && (
          <button
            onClick={handleClear}
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Card de instrumento agrupado
function InstrumentoCard({ instrumento, slugCaixa }: { instrumento: InstrumentoAgrupado; slugCaixa: string }) {
  const whatsappLink = getWhatsAppProdutoLink(instrumento.nome);
  const primeiraVariacao = instrumento.variacoes[0] as Instrumento & { variacaoTexto?: string };
  const imagemUrl = primeiraVariacao?.imagem_url || instrumento.imagem;

  // Usar sempre o ID para o link - é mais confiável que códigos que podem ser base64url
  const linkId = instrumento.id;

  return (
    <Link
      href={`/instrumentacao-cme/${slugCaixa}/${linkId}`}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-medical/30 hover:shadow-lg transition-all duration-300 block"
    >
      <div className="aspect-square relative overflow-hidden bg-gray-50">
        {imagemUrl ? (
          <Image
            src={imagemUrl}
            alt={instrumento.nome}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        )}

        {/* Badge de variações */}
        {instrumento.temVariacoes && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-medical text-white text-xs font-semibold rounded-full shadow-md">
            {getBadgeVariacoes(instrumento.variacoes.length)}
          </span>
        )}

        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(whatsappLink, '_blank');
          }}
          className="absolute bottom-2 right-2 w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-[#20bd5a] shadow-lg cursor-pointer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </span>
      </div>
      <div className="p-4">
        {instrumento.codigo && codigoValido(instrumento.codigo) && (
          <span className="text-medical text-xs font-medium">Cód: {instrumento.codigo}</span>
        )}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mt-1 group-hover:text-medical transition-colors">
          {instrumento.nome}
        </h3>
        {instrumento.temVariacoes && (
          <div className="flex flex-wrap gap-1 mt-2">
            {instrumento.variacoes.slice(0, 4).map((v, idx) => {
              const variacao = v as Instrumento & { variacaoTexto?: string };
              return variacao.variacaoTexto ? (
                <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {variacao.variacaoTexto}
                </span>
              ) : null;
            })}
            {instrumento.variacoes.length > 4 && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                +{instrumento.variacoes.length - 4}
              </span>
            )}
          </div>
        )}
        {!instrumento.temVariacoes && instrumento.descricao && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{instrumento.descricao}</p>
        )}
      </div>
    </Link>
  );
}

function CaixaCMEContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaSlug = params.categoria as string;

  const [caixa, setCaixa] = useState<CaixaCME | null>(null);
  const [instrumentosAgrupados, setInstrumentosAgrupados] = useState<InstrumentoAgrupado[]>([]);
  const [instrumentosFiltrados, setInstrumentosFiltrados] = useState<InstrumentoAgrupado[]>([]);
  const [totalOriginal, setTotalOriginal] = useState(0);
  const [outrasCaixas, setOutrasCaixas] = useState<CaixaCME[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [busca, setBusca] = useState(searchParams.get('busca') || '');

  useEffect(() => {
    const carregarDados = async () => {
      setIsLoading(true);
      try {
        const resCaixas = await fetch('/api/caixas-cme');
        const caixas: CaixaCME[] = await resCaixas.json();

        const caixaAtual = caixas.find(c => c.slug === categoriaSlug);
        if (!caixaAtual) {
          router.push('/instrumentacao-cme');
          return;
        }

        setCaixa(caixaAtual);
        setOutrasCaixas(caixas.filter(c => c.slug !== categoriaSlug));

        const resInstrumentos = await fetch(`/api/instrumentos?tabela=${encodeURIComponent(caixaAtual.nome_tabela)}`);
        const dados = await resInstrumentos.json();
        const instrumentosRaw: Instrumento[] = dados.instrumentos || [];
        setTotalOriginal(instrumentosRaw.length);

        // Agrupa instrumentos com variações
        const agrupados = agruparInstrumentos(instrumentosRaw.map(i => ({
          id: i.id,
          nome: i.nome,
          codigo: i.codigo,
          descricao: i.descricao,
          imagem_url: i.imagem_url
        })));

        setInstrumentosAgrupados(agrupados);
        setInstrumentosFiltrados(agrupados);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, [categoriaSlug, router]);

  useEffect(() => {
    if (!busca) {
      setInstrumentosFiltrados(instrumentosAgrupados);
    } else {
      const termo = busca.toLowerCase();
      const filtrados = instrumentosAgrupados.filter(
        i => i.nome.toLowerCase().includes(termo) ||
             i.nomeBase.toLowerCase().includes(termo) ||
             i.codigo?.toLowerCase().includes(termo) ||
             i.descricao?.toLowerCase().includes(termo) ||
             i.variacoes.some(v => v.nome.toLowerCase().includes(termo))
      );
      setInstrumentosFiltrados(filtrados);
    }
  }, [busca, instrumentosAgrupados]);

  const handleSearch = useCallback((valor: string) => {
    setBusca(valor);
    const params = new URLSearchParams(searchParams.toString());
    if (valor) {
      params.set('busca', valor);
    } else {
      params.delete('busca');
    }
    router.replace(`/instrumentacao-cme/${categoriaSlug}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, categoriaSlug]);

  const limparFiltros = () => {
    setBusca('');
    router.push(`/instrumentacao-cme/${categoriaSlug}`);
  };

  const handleCompartilhar = () => {
    if (navigator.share) {
      navigator.share({
        title: caixa?.nome_exibicao || 'Instrumentação CME',
        text: `Confira os instrumentos da ${caixa?.nome_exibicao}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? '' : 'sticky top-24'}>
      {isMobile && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
          <button onClick={() => setShowMobileFilters(false)} className="p-2 text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="mb-6">
        <Link href="/instrumentacao-cme" className="inline-flex items-center gap-2 text-medical hover:text-medical-dark font-medium text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para caixas
        </Link>
      </div>

      {/* Busca - apenas no desktop (mobile já tem barra de pesquisa principal) */}
      {!isMobile && (
        <SearchInput initialValue={busca} onSearch={handleSearch} placeholder="Buscar nesta caixa..." />
      )}

      <FilterSection title="Outras Caixas" defaultOpen={true}>
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {outrasCaixas.slice(0, 15).map((cx) => (
            <li key={cx.slug}>
              <Link href={`/instrumentacao-cme/${cx.slug}`} className="block text-sm py-1.5 px-2 rounded text-gray-600 hover:bg-gray-50 hover:text-medical transition-colors truncate">
                {cx.nome_exibicao}
                <span className="text-xs text-gray-400 ml-1">({cx.total_instrumentos})</span>
              </Link>
            </li>
          ))}
          {outrasCaixas.length > 15 && (
            <li>
              <Link href="/instrumentacao-cme" className="block text-sm py-1.5 px-2 text-medical hover:text-medical-dark font-medium">
                Ver todas as caixas →
              </Link>
            </li>
          )}
        </ul>
      </FilterSection>

      {busca && (
        <button onClick={limparFiltros} className="w-full mt-4 py-2 px-4 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          Limpar busca
        </button>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <Link href="/catalogo" className="inline-flex items-center gap-2 text-medical hover:text-medical-dark font-medium text-sm">
          Ver catálogo completo
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {isMobile && (
        <button onClick={() => setShowMobileFilters(false)} className="w-full mt-4 py-3 px-4 bg-medical text-white font-semibold rounded-lg hover:bg-medical-dark transition-colors">
          Ver {instrumentosFiltrados.length} instrumentos
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-medical border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando instrumentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b pt-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-medical hover:text-medical-dark">Início</Link>
            <span className="text-gray-400">/</span>
            <Link href="/instrumentacao-cme" className="text-medical hover:text-medical-dark">Instrumentação CME</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{caixa?.nome_exibicao}</span>
          </nav>
        </div>
      </div>

      <section className="bg-gradient-to-br from-medical to-medical-dark text-white py-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{caixa?.nome_exibicao}</h1>
            <p className="text-blue-100">{totalOriginal} {totalOriginal === 1 ? 'instrumento' : 'instrumentos'} disponíveis</p>
          </div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar />
          </aside>

          <main className="flex-1 min-w-0">
            {/* Barra de pesquisa mobile - sempre visível em telas pequenas */}
            <div className="lg:hidden mb-4">
              <SearchInput
                initialValue={busca}
                onSearch={handleSearch}
                placeholder="Buscar instrumento..."
                className=""
                showClearButton={true}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <p className="text-gray-500 text-sm sm:text-base">{instrumentosFiltrados.length} {instrumentosFiltrados.length === 1 ? 'instrumento encontrado' : 'instrumentos encontrados'}</p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={handleCompartilhar} className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Compartilhar
                </button>

                <button onClick={() => setShowMobileFilters(true)} className="hidden sm:flex lg:hidden items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                </button>

                {/* Botão de filtros mobile - mais compacto */}
                <button onClick={() => setShowMobileFilters(true)} className="sm:hidden flex items-center gap-2 px-3 py-2.5 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Mais filtros
                </button>
              </div>
            </div>

            {/* Tag de busca - só em desktop (mobile já tem na barra de pesquisa) */}
            {busca && (
              <div className="hidden lg:flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-medical-light text-medical rounded-full text-sm">
                  Busca: &quot;{busca}&quot;
                  <button onClick={limparFiltros} className="hover:text-medical-dark">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </div>
            )}

            {instrumentosFiltrados.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum instrumento encontrado</h3>
                <p className="text-gray-500 mb-4">Tente ajustar a busca</p>
                <button onClick={limparFiltros} className="px-6 py-2 bg-medical text-white rounded-lg font-medium hover:bg-medical-dark transition-colors">
                  Limpar busca
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {instrumentosFiltrados.map((instrumento) => (
                  <InstrumentoCard key={instrumento.id} instrumento={instrumento} slugCaixa={categoriaSlug} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto p-6">
            <FilterSidebar isMobile />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CaixaCMEPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-medical border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Carregando...</p>
          </div>
        </div>
      }
    >
      <CaixaCMEContent />
    </Suspense>
  );
}
