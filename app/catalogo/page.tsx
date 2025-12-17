'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ProdutoCatalogo, CatalogoPaginado } from '@/lib/api';
import { getWhatsAppProdutoLink } from '@/lib/whatsapp';
import { codigoValido } from '@/lib/instrumentUtils';

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
function SearchInputIsolated({
  initialValue,
  onSearchSubmit,
  placeholder = "Buscar...",
  inputId,
  className = "mb-6",
  showClearButton = false,
}: {
  initialValue: string;
  onSearchSubmit: (value: string) => void;
  placeholder?: string;
  inputId: string;
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
      onSearchSubmit(newValue);
    }, 500);
  };

  const handleClear = () => {
    setLocalValue('');
    lastSubmittedRef.current = '';
    onSearchSubmit('');
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
          id={inputId}
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

// Função para gerar URL do produto
function getProductUrl(produto: ProdutoCatalogo): string {
  if (produto.categoria_principal === 'Equipamentos Médicos') {
    // Equipamentos usam /equipamentos-medicos/[categoria]/[id]
    // Extrair o ID numérico do id composto (ex: "equip-tabela-123" -> "123")
    const idMatch = produto.id.match(/(\d+)$/);
    const idNumerico = idMatch ? idMatch[1] : produto.id;
    return `/equipamentos-medicos/${produto.caixa_slug}/${idNumerico}`;
  } else {
    // CME usa /instrumentacao-cme/[categoria]/[codigo]
    // Extrair o ID numérico do id composto (ex: "cme-tabela-123" -> "123")
    // Usar ID em vez de código para garantir que sempre encontre
    const idMatch = produto.id.match(/(\d+)$/);
    const idNumerico = idMatch ? idMatch[1] : produto.codigo || produto.id;
    return `/instrumentacao-cme/${produto.caixa_slug}/${idNumerico}`;
  }
}

// Card de produto
function ProductCard({ produto }: { produto: ProdutoCatalogo }) {
  const whatsappLink = getWhatsAppProdutoLink(produto.nome);
  const productUrl = getProductUrl(produto);

  return (
    <Link
      href={productUrl}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 block"
    >
      {/* Imagem */}
      <div className="aspect-square relative overflow-hidden bg-gray-50">
        {produto.imagem_url ? (
          <Image
            src={produto.imagem_url}
            alt={produto.nome}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Badge categoria */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            produto.categoria_principal === 'Equipamentos Médicos'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}>
            {produto.categoria_principal === 'Equipamentos Médicos' ? 'Equipamento' : 'CME'}
          </span>
        </div>
        {/* Botão WhatsApp no hover */}
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

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
          {produto.nome}
        </h3>
        <p className="text-xs text-gray-500 mb-2">{produto.caixa_nome}</p>
        {produto.codigo && codigoValido(produto.codigo) && (
          <p className="text-xs text-gray-400">Cód: {produto.codigo}</p>
        )}
      </div>
    </Link>
  );
}

// Componente principal do catálogo (com Suspense wrapper)
function CatalogoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [catalogo, setCatalogo] = useState<CatalogoPaginado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parâmetros de URL
  const busca = searchParams.get('busca') || '';
  const categoria = searchParams.get('categoria') || '';
  const caixa = searchParams.get('caixa') || '';
  const ordenacao = (searchParams.get('ordenacao') as 'nome-asc' | 'nome-desc' | 'recentes') || 'nome-asc';
  const pagina = parseInt(searchParams.get('pagina') || '1');

  // Buscar dados via API Route
  const fetchCatalogo = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        porPagina: '24',
        ...(busca && { busca }),
        ...(categoria && { categoria }),
        ...(caixa && { caixa }),
        ordenacao,
      });

      const response = await fetch(`/api/catalogo?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar catálogo');
      }
      const resultado: CatalogoPaginado = await response.json();

      // Não removemos produtos por código inválido - apenas ocultamos o código na exibição
      // O filtro codigoValido deve ser usado apenas para decidir se exibe o código, não para remover produtos
      setCatalogo(resultado);
    } catch (error) {
      console.error('Erro ao buscar catálogo:', error);
      setCatalogo({
        produtos: [],
        total: 0,
        pagina: 1,
        porPagina: 24,
        totalPaginas: 0,
        filtros: { categorias: [], caixas: [] },
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagina, busca, categoria, caixa, ordenacao]);

  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);

  // Atualizar URL com filtros
  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset página quando mudar filtros (exceto quando mudando a página)
    if (!('pagina' in newFilters)) {
      params.delete('pagina');
    }

    router.push(`/catalogo?${params.toString()}`);
  };

  // Handler de busca - chamado pelo componente SearchInput após debounce
  // Usa useRef para evitar dependência de searchParams que causa re-renders
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const handleSearch = useCallback((valor: string) => {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    if (valor) {
      params.set('busca', valor);
    } else {
      params.delete('busca');
    }
    params.delete('pagina'); // Reset página ao buscar
    router.replace(`/catalogo?${params.toString()}`, { scroll: false });
  }, [router]);

  // Limpar todos os filtros
  const limparFiltros = () => {
    router.push('/catalogo');
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

      {/* Busca - apenas no desktop/sidebar (mobile já tem barra de pesquisa principal na tela) */}
      {!isMobile && (
        <SearchInputIsolated
          initialValue={busca}
          onSearchSubmit={handleSearch}
          placeholder="Buscar produtos..."
          inputId="busca-desktop"
        />
      )}

      {/* Filtro por Categoria */}
      <FilterSection title="Categoria" defaultOpen={true}>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => updateFilters({ categoria: '' })}
              className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                !categoria ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Todos os produtos
            </button>
          </li>
          {catalogo?.filtros.categorias.map((cat) => (
            <li key={cat.nome}>
              <button
                onClick={() => updateFilters({ categoria: cat.nome, caixa: '' })}
                className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors flex justify-between items-center ${
                  categoria === cat.nome ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{cat.nome}</span>
                <span className="text-xs text-gray-400">({cat.total})</span>
              </button>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* Filtro por Caixa/Conjunto */}
      <FilterSection title="Caixa / Conjunto" defaultOpen={true}>
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          <li>
            <button
              onClick={() => updateFilters({ caixa: '' })}
              className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                !caixa ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Todas as caixas
            </button>
          </li>
          {catalogo?.filtros.caixas
            .filter((c) => !categoria || c.categoria === categoria)
            .map((cx) => (
              <li key={cx.slug}>
                <button
                  onClick={() => updateFilters({ caixa: cx.slug })}
                  className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors flex justify-between items-center ${
                    caixa === cx.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate pr-2">{cx.nome}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">({cx.total})</span>
                </button>
              </li>
            ))}
        </ul>
      </FilterSection>

      {/* Botão limpar filtros */}
      {(busca || categoria || caixa) && (
        <button
          onClick={limparFiltros}
          className="w-full mt-4 py-2 px-4 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Limpar todos os filtros
        </button>
      )}

      {/* Botão aplicar no mobile */}
      {isMobile && (
        <button
          onClick={() => setShowMobileFilters(false)}
          className="w-full mt-4 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver {catalogo?.total || 0} produtos
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-700 transition-colors">
            Página Inicial
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Catálogo</span>
          {categoria && (
            <>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{categoria}</span>
            </>
          )}
        </nav>

        <div className="flex gap-8">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar />
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1 min-w-0">
            {/* Barra de pesquisa mobile - sempre visível em telas pequenas */}
            <div className="lg:hidden mb-4">
              <SearchInputIsolated
                initialValue={busca}
                onSearchSubmit={handleSearch}
                placeholder="Buscar produtos..."
                inputId="busca-mobile-main"
                className=""
                showClearButton={true}
              />
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {categoria || 'Todos os Produtos'}
                </h1>
                <p className="text-gray-500 mt-1">
                  {isLoading ? 'Carregando...' : `${catalogo?.total || 0} produtos encontrados`}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Botão Compartilhar - Desktop */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Catálogo PenseMed',
                        text: 'Confira o catálogo completo de equipamentos médicos da PenseMed',
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copiado para a área de transferência!');
                    }
                  }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Compartilhar
                </button>

                {/* Botão Filtros - Desktop/Tablet (mostra/esconde sidebar) */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="hidden sm:flex lg:hidden items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                </button>

                {/* Botão filtros mobile */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="sm:hidden flex items-center gap-2 px-3 py-2.5 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Mais filtros
                </button>
              </div>
            </div>

            {/* Tags de filtros ativos */}
            {(busca || categoria || caixa) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {/* Tag de busca - só em desktop (mobile já tem na barra de pesquisa) */}
                {busca && (
                  <span className="hidden lg:inline-flex items-center gap-1 px-3 py-1 bg-medical-light text-medical rounded-full text-sm">
                    Busca: &quot;{busca}&quot;
                    <button onClick={() => updateFilters({ busca: '' })} className="hover:text-medical-dark">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {categoria && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                    {categoria}
                    <button onClick={() => updateFilters({ categoria: '', caixa: '' })} className="hover:text-emerald-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {caixa && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {catalogo?.filtros.caixas.find((c) => c.slug === caixa)?.nome || caixa}
                    <button onClick={() => updateFilters({ caixa: '' })} className="hover:text-purple-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Grid de produtos */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : catalogo?.produtos.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-500 mb-4">Tente ajustar os filtros ou a busca</p>
                <button
                  onClick={limparFiltros}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {catalogo?.produtos.map((produto) => (
                  <ProductCard key={produto.id} produto={produto} />
                ))}
              </div>
            )}

            {/* Paginação */}
            {catalogo && catalogo.totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => updateFilters({ pagina: String(pagina - 1) })}
                  disabled={pagina <= 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, catalogo.totalPaginas) }).map((_, i) => {
                    let pageNum: number;
                    if (catalogo.totalPaginas <= 5) {
                      pageNum = i + 1;
                    } else if (pagina <= 3) {
                      pageNum = i + 1;
                    } else if (pagina >= catalogo.totalPaginas - 2) {
                      pageNum = catalogo.totalPaginas - 4 + i;
                    } else {
                      pageNum = pagina - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateFilters({ pagina: String(pageNum) })}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          pagina === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => updateFilters({ pagina: String(pagina + 1) })}
                  disabled={pagina >= catalogo.totalPaginas}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
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
export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Carregando catálogo...</p>
          </div>
        </div>
      }
    >
      <CatalogoContent />
    </Suspense>
  );
}
