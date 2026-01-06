'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getWhatsAppProdutoLink } from '@/lib/whatsapp';
import { agruparInstrumentos, getBadgeVariacoes, InstrumentoAgrupado } from '@/lib/instrumentUtils';
import LoadingScreen from '@/components/LoadingScreen';
import ShareDropdown from '@/components/ShareDropdown';
import BackButton from '@/components/BackButton';

interface Equipamento {
  id: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  imagem_url?: string;
}

interface CategoriaEquipamento {
  nome_tabela: string;
  nome_exibicao: string;
  slug: string;
  total_itens: number;
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

// Componente de busca 100% isolado com estado não-controlado
// Usa ref para manter o valor e não depende de props externas durante digitação
function SearchInput({
  initialValue,
  onSearch,
  placeholder = "Buscar...",
  className = "mb-6",
  showClearButton = false,
  inputId,
}: {
  initialValue: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
  inputId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [displayValue, setDisplayValue] = useState(initialValue);

  // Sincroniza apenas quando limpar filtros (valor vazio vindo de fora)
  useEffect(() => {
    if (initialValue === '' && displayValue !== '') {
      setDisplayValue('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onSearch(newValue);
    }, 400);
  };

  const handleClear = () => {
    setDisplayValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onSearch('');
  };

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
          ref={inputRef}
          id={inputId}
          type="text"
          defaultValue={initialValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pl-11 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base bg-white shadow-sm ${showClearButton && displayValue ? 'pr-10' : 'pr-4'}`}
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
        {showClearButton && displayValue && (
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

// Card de equipamento agrupado
function EquipamentoCard({ equipamento, slugCategoria }: { equipamento: InstrumentoAgrupado; slugCategoria: string }) {
  const whatsappLink = getWhatsAppProdutoLink(equipamento.nome);
  const primeiraVariacao = equipamento.variacoes[0] as Equipamento & { variacaoTexto?: string };
  const imagemUrl = primeiraVariacao?.imagem_url || equipamento.imagem;

  return (
    <Link
      href={`/equipamentos-medicos/${slugCategoria}/${equipamento.id}`}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 block"
    >
      <div className="aspect-square relative overflow-hidden bg-white">
        {imagemUrl ? (
          <Image
            src={imagemUrl}
            alt={equipamento.nome}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badge de variações */}
        {equipamento.temVariacoes && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-md">
            {getBadgeVariacoes(equipamento.variacoes.length)}
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
        {equipamento.codigo && (
          <span className="text-emerald-600 text-xs font-medium">Cód: {equipamento.codigo}</span>
        )}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mt-1 group-hover:text-emerald-600 transition-colors">
          {equipamento.nome}
        </h3>
        {equipamento.temVariacoes && (
          <div className="flex flex-wrap gap-1 mt-2">
            {equipamento.variacoes.slice(0, 4).map((v, idx) => {
              const variacao = v as Equipamento & { variacaoTexto?: string };
              return variacao.variacaoTexto ? (
                <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {variacao.variacaoTexto}
                </span>
              ) : null;
            })}
            {equipamento.variacoes.length > 4 && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                +{equipamento.variacoes.length - 4}
              </span>
            )}
          </div>
        )}
        {!equipamento.temVariacoes && equipamento.descricao && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{equipamento.descricao}</p>
        )}
      </div>
    </Link>
  );
}

function CategoriaEquipamentoContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaSlug = decodeURIComponent(params.categoria as string);

  const [categoria, setCategoria] = useState<CategoriaEquipamento | null>(null);
  const [equipamentosAgrupados, setEquipamentosAgrupados] = useState<InstrumentoAgrupado[]>([]);
  const [equipamentosFiltrados, setEquipamentosFiltrados] = useState<InstrumentoAgrupado[]>([]);
  const [totalOriginal, setTotalOriginal] = useState(0);
  const [outrasCategorias, setOutrasCategorias] = useState<CategoriaEquipamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [busca, setBusca] = useState(searchParams.get('busca') || '');

  useEffect(() => {
    const carregarDados = async () => {
      setIsLoading(true);
      try {
        const resCategorias = await fetch('/api/categorias-equipamentos');
        const categorias: CategoriaEquipamento[] = await resCategorias.json();

        const categoriaAtual = categorias.find(c => c.slug === categoriaSlug);
        if (!categoriaAtual) {
          router.push('/equipamentos-medicos');
          return;
        }

        setCategoria(categoriaAtual);
        setOutrasCategorias(categorias.filter(c => c.slug !== categoriaSlug));

        const resEquipamentos = await fetch(`/api/equipamentos?tabela=${encodeURIComponent(categoriaAtual.nome_tabela)}`);
        const dados = await resEquipamentos.json();
        const equipamentosRaw: Equipamento[] = dados.equipamentos || [];

        // Se só tem 1 equipamento, redireciona para detalhes
        if (equipamentosRaw.length === 1) {
          router.push(`/equipamentos-medicos/${categoriaSlug}/${equipamentosRaw[0].id}`);
          return;
        }

        setTotalOriginal(equipamentosRaw.length);

        // Agrupa equipamentos com variações
        const agrupados = agruparInstrumentos(equipamentosRaw.map(e => ({
          id: e.id,
          nome: e.nome,
          codigo: e.codigo,
          descricao: e.descricao,
          imagem_url: e.imagem_url
        })));

        setEquipamentosAgrupados(agrupados);
        setEquipamentosFiltrados(agrupados);
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
      setEquipamentosFiltrados(equipamentosAgrupados);
    } else {
      const termo = busca.toLowerCase();
      const filtrados = equipamentosAgrupados.filter(
        e => e.nome.toLowerCase().includes(termo) ||
             e.nomeBase.toLowerCase().includes(termo) ||
             e.codigo?.toLowerCase().includes(termo) ||
             e.descricao?.toLowerCase().includes(termo) ||
             e.variacoes.some(v => v.nome.toLowerCase().includes(termo))
      );
      setEquipamentosFiltrados(filtrados);
    }
  }, [busca, equipamentosAgrupados]);

  const handleSearch = useCallback((valor: string) => {
    setBusca(valor);
    const params = new URLSearchParams(searchParams.toString());
    if (valor) {
      params.set('busca', valor);
    } else {
      params.delete('busca');
    }
    router.replace(`/equipamentos-medicos/${categoriaSlug}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, categoriaSlug]);

  const limparFiltros = () => {
    setBusca('');
    router.push(`/equipamentos-medicos/${categoriaSlug}`);
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
        <Link href="/equipamentos-medicos" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para equipamentos
        </Link>
      </div>

      <SearchInput initialValue={busca} onSearch={handleSearch} placeholder="Buscar nesta categoria..." />

      <FilterSection title="Outras Categorias" defaultOpen={true}>
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {outrasCategorias.slice(0, 15).map((cat) => (
            <li key={cat.slug}>
              <Link href={`/equipamentos-medicos/${cat.slug}`} className="block text-sm py-1.5 px-2 rounded text-gray-600 hover:bg-gray-50 hover:text-emerald-600 transition-colors truncate">
                {cat.nome_exibicao}
                <span className="text-xs text-gray-400 ml-1">({cat.total_itens})</span>
              </Link>
            </li>
          ))}
          {outrasCategorias.length > 15 && (
            <li>
              <Link href="/equipamentos-medicos" className="block text-sm py-1.5 px-2 text-emerald-600 hover:text-emerald-700 font-medium">
                Ver todas as categorias →
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
        <Link href="/catalogo" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm">
          Ver catálogo completo
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {isMobile && (
        <button onClick={() => setShowMobileFilters(false)} className="w-full mt-4 py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
          Ver {equipamentosFiltrados.length} equipamentos
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return <LoadingScreen message="Carregando equipamentos..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24">
      <div className="bg-white border-b">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <BackButton
              fallbackUrl="/equipamentos-medicos"
              label="Voltar"
            />
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">Início</Link>
            <span className="text-gray-400">/</span>
            <Link href="/equipamentos-medicos" className="text-emerald-600 hover:text-emerald-700">Equipamentos Médicos</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{categoria?.nome_exibicao}</span>
          </nav>
        </div>
      </div>

      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{categoria?.nome_exibicao}</h1>
            <p className="text-emerald-100">{totalOriginal} {totalOriginal === 1 ? 'equipamento disponível' : 'equipamentos disponíveis'}</p>
          </div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar />
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-gray-500">{equipamentosFiltrados.length} {equipamentosFiltrados.length === 1 ? 'equipamento encontrado' : 'equipamentos encontrados'}</p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <ShareDropdown
                  title={categoria?.nome_exibicao || 'Equipamentos Médicos'}
                />

                <button onClick={() => setShowMobileFilters(true)} className="hidden sm:flex lg:hidden items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                  {busca && <span className="ml-1 w-5 h-5 bg-emerald-600 text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>}
                </button>

                <button onClick={() => setShowMobileFilters(true)} className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                </button>
              </div>
            </div>

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

            {equipamentosFiltrados.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum equipamento encontrado</h3>
                <p className="text-gray-500 mb-4">Tente ajustar a busca</p>
                <button onClick={limparFiltros} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                  Limpar busca
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {equipamentosFiltrados.map((equipamento) => (
                  <EquipamentoCard key={equipamento.id} equipamento={equipamento} slugCategoria={categoriaSlug} />
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

export default function CategoriaEquipamentoPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CategoriaEquipamentoContent />
    </Suspense>
  );
}
