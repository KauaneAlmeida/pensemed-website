'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CategoriaEquipamento } from '@/lib/types';
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

// Card de Categoria Equipamento
function CategoriaCard({ categoria }: { categoria: CategoriaEquipamento }) {
  return (
    <Link
      href={`/equipamentos-medicos/${categoria.slug}`}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 block"
    >
      {/* Imagem */}
      <div className="aspect-square relative overflow-hidden bg-white">
        {categoria.imagem_url ? (
          <Image
            src={categoria.imagem_url}
            alt={categoria.nome_exibicao}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
        )}
        {/* Badge de quantidade */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
            {categoria.total_itens} {categoria.total_itens === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
          {categoria.nome_exibicao}
        </h3>
        <div className="flex items-center text-emerald-600 text-xs font-medium">
          <span>Ver equipamentos</span>
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// Componente principal
function EquipamentosMedicosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [categorias, setCategorias] = useState<CategoriaEquipamento[]>([]);
  const [filteredCategorias, setFilteredCategorias] = useState<CategoriaEquipamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parâmetros de URL
  const busca = searchParams.get('busca') || '';

  // Buscar dados
  const fetchCategorias = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categorias-equipamentos');
      if (!response.ok) throw new Error('Erro ao buscar categorias');
      const data = await response.json();
      setCategorias(data);
      setFilteredCategorias(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      setCategorias([]);
      setFilteredCategorias([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // Filtrar por busca
  useEffect(() => {
    if (busca) {
      const filtered = categorias.filter(categoria =>
        categoria.nome_exibicao.toLowerCase().includes(busca.toLowerCase())
      );
      setFilteredCategorias(filtered);
    } else {
      setFilteredCategorias(categorias);
    }
  }, [busca, categorias]);

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
      router.replace(`/equipamentos-medicos?${params.toString()}`, { scroll: false });
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
    router.push('/equipamentos-medicos');
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
            id={isMobile ? 'busca-equip-mobile' : 'busca-equip-desktop'}
            type="text"
            defaultValue={busca}
            onChange={handleBuscaChange}
            placeholder="Buscar categorias..."
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

      {/* Filtro por Categoria */}
      <FilterSection title="Categorias Disponíveis" defaultOpen={true}>
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {categorias.map((categoria) => (
            <li key={categoria.slug}>
              <Link
                href={`/equipamentos-medicos/${categoria.slug}`}
                className="w-full text-left text-sm py-1.5 px-2 rounded transition-colors flex justify-between items-center text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <span className="truncate pr-2">{categoria.nome_exibicao}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">({categoria.total_itens})</span>
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
          href="/catalogo?categoria=Equipamentos Médicos"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors text-sm"
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
          className="w-full mt-4 py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Ver {filteredCategorias.length} categorias
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Verde/Teal */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white pt-24 pb-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-emerald-200 mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              Página Inicial
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white font-medium">Equipamentos Médicos</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            Equipamentos Médicos
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl">
            Equipamentos médicos hospitalares de última geração para locação, com manutenção e suporte técnico especializado.
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

          {/* Grid de Categorias */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-gray-500">
                  {isLoading ? 'Carregando...' : `${filteredCategorias.length} categorias disponíveis`}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Botão Compartilhar */}
                <ShareDropdown
                  title="Equipamentos Médicos - PenseMed"
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
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  Busca: &quot;{busca}&quot;
                  <button onClick={limparFiltros} className="hover:text-emerald-900">
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
            ) : filteredCategorias.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
                <p className="text-gray-500 mb-4">Tente ajustar a busca</p>
                <button
                  onClick={limparFiltros}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  Limpar busca
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredCategorias.map((categoria) => (
                  <CategoriaCard key={categoria.slug} categoria={categoria} />
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
export default function EquipamentosMedicosPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Carregando equipamentos médicos..." />}>
      <EquipamentosMedicosContent />
    </Suspense>
  );
}
