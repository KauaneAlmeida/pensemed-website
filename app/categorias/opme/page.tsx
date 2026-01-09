'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ProdutoOPME } from '@/lib/types';
import { getWhatsAppProdutoLink } from '@/lib/whatsapp';
import LoadingScreen from '@/components/LoadingScreen';
import ShareDropdown from '@/components/ShareDropdown';
import { getOPMEProductImages } from '@/hooks/useProductImages';

// Tipo estendido para produto com imagem
interface ProdutoOPMEComImagem extends ProdutoOPME {
  imagem_principal?: string | null;
}

// Card de Produto OPME - seguindo padrão visual de CME e Equipamentos (fundo branco)
function ProdutoOPMECard({ produto }: { produto: ProdutoOPMEComImagem }) {
  const whatsappLink = getWhatsAppProdutoLink(produto.nome);
  const [imagemUrl, setImagemUrl] = useState<string | null>(produto.imagem_principal || null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(!produto.imagem_principal);

  // Buscar imagem ao montar o card (se não tiver imagem_principal)
  useEffect(() => {
    if (!produto.imagem_principal) {
      getOPMEProductImages(produto.id).then(({ data }) => {
        if (data && data.length > 0) {
          // Filtrar apenas imagens com ordem 0 (principal) e pegar a mais recente (maior ID)
          const imagensOrdem0 = data.filter(img => img.ordem === 0);
          const principal = imagensOrdem0.length > 0
            ? imagensOrdem0.reduce((a, b) => a.id > b.id ? a : b)
            : data.reduce((a, b) => a.id > b.id ? a : b);
          setImagemUrl(principal.url);
        }
        setLoading(false);
      });
    }
  }, [produto.id, produto.imagem_principal]);

  return (
    <Link
      href={`/categorias/opme/${produto.id}`}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[#09354d]/30 hover:shadow-lg transition-all duration-300 block"
    >
      {/* Imagem */}
      <div className="aspect-square relative overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : imagemUrl && !imageError ? (
          <Image
            src={imagemUrl}
            alt={produto.nome}
            fill
            className="object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badge categoria ou OPME */}
        <div className="absolute top-2 left-2 sm:top-2 sm:left-2">
          <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-[#09354d]/10 text-[#09354d]">
            {produto.categoria || 'OPME'}
          </span>
        </div>

        {/* Botão WhatsApp - visível sempre no mobile, hover no desktop */}
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(whatsappLink, '_blank');
          }}
          className="absolute bottom-2 right-2 w-8 h-8 sm:w-10 sm:h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 hover:bg-[#20bd5a] shadow-lg cursor-pointer z-20"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </span>
      </div>

      {/* Info - responsivo igual CME e Equipamentos */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 group-hover:text-[#09354d] transition-colors">
          {produto.nome}
        </h3>

        {/* Fabricante - apenas se existir, escondido no mobile muito pequeno */}
        {produto.fabricante && (
          <p className="hidden sm:block text-xs text-gray-500 truncate mb-2">
            {produto.fabricante}
          </p>
        )}

        {/* Call to action */}
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

// Componente principal
function OPMEContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [produtos, setProdutos] = useState<ProdutoOPME[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parâmetros de URL
  const busca = searchParams.get('busca') || '';
  const categoriaFiltro = searchParams.get('categoria') || '';

  // Refs para input não controlado
  const inputDesktopRef = useRef<HTMLInputElement>(null);
  const inputMobileRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar dados
  const fetchProdutos = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      if (categoriaFiltro) params.set('categoria', categoriaFiltro);
      params.set('porPagina', '100');

      const response = await fetch(`/api/opme?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      const data = await response.json();

      setProdutos(data.produtos || []);
      setCategorias(data.categorias || []);
    } catch (error) {
      console.error('Erro ao buscar produtos OPME:', error);
      setProdutos([]);
    } finally {
      setIsLoading(false);
    }
  }, [busca, categoriaFiltro]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  // Sincronizar inputs com URL
  useEffect(() => {
    if (inputDesktopRef.current) {
      inputDesktopRef.current.value = busca;
    }
    if (inputMobileRef.current) {
      inputMobileRef.current.value = busca;
    }
  }, [busca]);

  // Handler do input com debounce
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
      router.replace(`/categorias/opme?${params.toString()}`, { scroll: false });
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

  // Filtrar por categoria
  const handleCategoriaClick = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === categoriaFiltro) {
      params.delete('categoria');
    } else {
      params.set('categoria', cat);
    }
    router.replace(`/categorias/opme?${params.toString()}`, { scroll: false });
  };

  // Limpar filtros
  const limparFiltros = () => {
    if (inputDesktopRef.current) inputDesktopRef.current.value = '';
    if (inputMobileRef.current) inputMobileRef.current.value = '';
    router.push('/categorias/opme');
  };

  const temFiltrosAtivos = busca || categoriaFiltro;

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
            id={isMobile ? 'busca-opme-mobile' : 'busca-opme-desktop'}
            type="text"
            defaultValue={busca}
            onChange={handleBuscaChange}
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09354d] focus:border-transparent text-sm"
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
      <FilterSection title="Categorias" defaultOpen={true}>
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {categorias.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => handleCategoriaClick(cat)}
                className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                  categoriaFiltro === cat
                    ? 'bg-[#09354d] text-white font-medium'
                    : 'text-gray-600 hover:bg-[#09354d]/10 hover:text-[#09354d]'
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* Botão limpar filtros */}
      {temFiltrosAtivos && (
        <button
          onClick={limparFiltros}
          className="w-full mt-4 py-2 px-4 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Limpar filtros
        </button>
      )}

      {/* Link para catálogo completo */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <Link
          href="/catalogo?categoria=OPME"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#09354d] text-white font-semibold rounded-lg hover:bg-[#072a3d] transition-colors text-sm"
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
          className="w-full mt-4 py-3 px-4 bg-[#09354d] text-white font-semibold rounded-lg hover:bg-[#072a3d] transition-colors"
        >
          Ver {produtos.length} produtos
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
            <span className="text-white font-medium">OPME</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            OPME
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl">
            Órteses, Próteses e Materiais Especiais - Materiais descartáveis de alta qualidade para procedimentos cirúrgicos
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

          {/* Grid de Produtos */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-gray-500">
                  {isLoading ? 'Carregando...' : `${produtos.length} produtos${categoriaFiltro ? ` em "${categoriaFiltro}"` : ''}`}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Botão Compartilhar */}
                <ShareDropdown title="OPME - PenseMed" />

                {/* Botão Filtros Mobile */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                  {temFiltrosAtivos && (
                    <span className="ml-1 w-5 h-5 bg-white text-gray-900 rounded-full text-xs flex items-center justify-center font-bold">
                      !
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tags de filtros ativos */}
            {temFiltrosAtivos && (
              <div className="flex flex-wrap gap-2 mb-6">
                {busca && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                    Busca: &quot;{busca}&quot;
                    <button onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete('busca');
                      router.replace(`/categorias/opme?${params.toString()}`);
                    }} className="hover:text-gray-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {categoriaFiltro && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-700 text-white rounded-full text-sm">
                    {categoriaFiltro}
                    <button onClick={() => handleCategoriaClick(categoriaFiltro)} className="hover:text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
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
            ) : produtos.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-500 mb-4">Tente ajustar os filtros de busca</p>
                <button
                  onClick={limparFiltros}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {produtos.map((produto) => (
                  <ProdutoOPMECard key={produto.id} produto={produto} />
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
export default function OPMEPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Carregando produtos OPME..." />}>
      <OPMEContent />
    </Suspense>
  );
}
