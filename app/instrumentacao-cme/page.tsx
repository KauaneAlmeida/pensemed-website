'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CaixaCME } from '@/lib/types';
import LoadingScreen from '@/components/LoadingScreen';
import ShareDropdown from '@/components/ShareDropdown';

// Componente de filtro accordion
function FilterSection({
  title,
  children,
  defaultOpen = true,
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

// Card de Caixa CME
function CaixaCard({ caixa }: { caixa: CaixaCME }) {
  return (
    <Link
      href={`/instrumentacao-cme/${caixa.slug}`}
      className="group bg-white overflow-hidden border border-gray-100 hover:border-[#205b67]/30 hover:shadow-lg transition-all duration-300 block"
    >
      {/* Imagem - sem bordas, cobrindo todo o espaço */}
      <div className="aspect-square relative overflow-hidden bg-gray-50">
        {caixa.imagem_url ? (
          <Image
            src={caixa.imagem_url}
            alt={caixa.nome_exibicao}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        {/* Badge de quantidade */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#205b67]/10 text-[#205b67]">
            {caixa.total_instrumentos} {caixa.total_instrumentos === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-[#205b67] transition-colors">
          {caixa.nome_exibicao}
        </h3>
        <div className="flex items-center text-[#205b67] text-xs font-medium">
          <span>Ver instrumentos</span>
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// Componente principal
function InstrumentacaoCMEContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [caixas, setCaixas] = useState<CaixaCME[]>([]);
  const [filteredCaixas, setFilteredCaixas] = useState<CaixaCME[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parâmetros de URL
  const busca = searchParams.get('busca') || '';

  // Buscar dados
  const fetchCaixas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/caixas-cme');
      if (!response.ok) throw new Error('Erro ao buscar caixas');
      const data = await response.json();
      setCaixas(data);
      setFilteredCaixas(data);
    } catch (error) {
      console.error('Erro ao buscar caixas:', error);
      setCaixas([]);
      setFilteredCaixas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCaixas();
  }, [fetchCaixas]);

  // Filtrar por busca
  useEffect(() => {
    if (busca) {
      const filtered = caixas.filter(caixa =>
        caixa.nome_exibicao.toLowerCase().includes(busca.toLowerCase())
      );
      setFilteredCaixas(filtered);
    } else {
      setFilteredCaixas(caixas);
    }
  }, [busca, caixas]);

  // Refs para input não controlado - evita re-renders durante digitação
  const inputDesktopRef = useRef<HTMLInputElement>(null);
  const inputMobileRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar inputs com URL quando busca muda externamente (ex: limpar filtros)
  useEffect(() => {
    if (inputDesktopRef.current) {
      inputDesktopRef.current.value = busca;
    }
    if (inputMobileRef.current) {
      inputMobileRef.current.value = busca;
    }
  }, [busca]);

  // Handler do input com debounce - usa valor direto do DOM, sem setState
  const handleBuscaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (valor) {
        params.set('busca', valor);
      } else {
        params.delete('busca');
      }
      router.replace(`/instrumentacao-cme?${params.toString()}`, { scroll: false });
    }, 500);
  }, [searchParams, router]);

  // Cleanup do timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Limpar filtros
  const limparFiltros = () => {
    if (inputDesktopRef.current) {
      inputDesktopRef.current.value = '';
    }
    if (inputMobileRef.current) {
      inputMobileRef.current.value = '';
    }
    router.push('/instrumentacao-cme');
  };

  // Sidebar de filtros
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? '' : 'sticky top-24'}>
      {/* Header mobile */}
      {isMobile && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <input
            ref={isMobile ? inputMobileRef : inputDesktopRef}
            id={isMobile ? 'busca-cme-mobile' : 'busca-cme-desktop'}
            type="text"
            defaultValue={busca}
            onChange={handleBuscaChange}
            placeholder="Buscar caixas..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical focus:border-transparent text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filtro por Caixa */}
      <FilterSection title="Caixas Disponíveis" defaultOpen={true}>
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {caixas.map((caixa) => (
            <li key={caixa.slug}>
              <Link
                href={`/instrumentacao-cme/${caixa.slug}`}
                className="w-full text-left text-sm py-1.5 px-2 rounded transition-colors flex justify-between items-center text-gray-600 hover:bg-[#205b67]/10 hover:text-[#205b67]"
              >
                <span className="truncate pr-2">{caixa.nome_exibicao}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">({caixa.total_instrumentos})</span>
              </Link>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* Botão limpar filtros */}
      {busca && (
        <button
          onClick={limparFiltros}
          className="w-full mt-4 py-2 px-4 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Limpar busca
        </button>
      )}

      {/* Link para catálogo completo */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <Link
          href="/catalogo?categoria=Instrumentação Cirúrgica CME"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#205b67] text-white font-semibold rounded-lg hover:bg-[#184954] transition-colors text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Ver catálogo completo
        </Link>
      </div>

      {/* Botão aplicar no mobile */}
      {isMobile && (
        <button
          onClick={() => setShowMobileFilters(false)}
          className="w-full mt-4 py-3 px-4 bg-[#205b67] text-white font-semibold rounded-lg hover:bg-[#184954] transition-colors"
        >
          Ver {filteredCaixas.length} caixas
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#09354d] to-[#205b67] text-white pt-28 sm:pt-32 pb-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm sm:text-base text-gray-300 mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              Página Inicial
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white font-medium">Instrumentação Cirúrgica CME</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            Instrumentação Cirúrgica CME
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl">
            Instrumentação cirúrgica completa com processamento em CME certificado, garantindo segurança e qualidade.
          </p>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar />
          </aside>

          {/* Grid de Caixas */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-gray-500">
                  {isLoading ? 'Carregando...' : `${filteredCaixas.length} caixas disponíveis`}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Botão Compartilhar */}
                <ShareDropdown
                  title="Instrumentação Cirúrgica CME - PenseMed"
                />

                {/* Botão Filtros - Desktop/Tablet */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                  {busca && (
                    <span className="ml-1 w-5 h-5 bg-medical text-white rounded-full text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                  )}
                </button>

                {/* Botão filtros mobile */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                  {busca && (
                    <span className="ml-1 w-5 h-5 bg-white text-gray-900 rounded-full text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tags de filtros ativos */}
            {busca && (
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#205b67]/10 text-[#205b67] rounded-full text-sm">
                  Busca: &quot;{busca}&quot;
                  <button onClick={limparFiltros} className="hover:text-[#09354d]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </div>
            )}

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCaixas.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma caixa encontrada</h3>
                <p className="text-gray-500 mb-4">Tente ajustar a busca</p>
                <button
                  onClick={limparFiltros}
                  className="px-6 py-2 bg-[#205b67] text-white rounded-lg font-medium hover:bg-[#184954] transition-colors"
                >
                  Limpar busca
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredCaixas.map((caixa) => (
                  <CaixaCard key={caixa.slug} caixa={caixa} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal filtros mobile */}
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

// Página principal com Suspense
export default function InstrumentacaoCMEPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Carregando instrumentação CME..." />}>
      <InstrumentacaoCMEContent />
    </Suspense>
  );
}
