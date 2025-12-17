'use client';

import Link from 'next/link';

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  baseUrl: string;
  subcategoria?: string;
}

export default function Pagination({
  paginaAtual,
  totalPaginas,
  baseUrl,
  subcategoria,
}: PaginationProps) {
  if (totalPaginas <= 1) return null;

  const gerarUrl = (pagina: number) => {
    const params = new URLSearchParams();
    params.set('pagina', pagina.toString());
    if (subcategoria) {
      params.set('subcategoria', subcategoria);
    }
    return `${baseUrl}?${params.toString()}`;
  };

  const renderPaginaNumero = (numero: number) => {
    const isAtiva = numero === paginaAtual;
    return (
      <Link
        key={numero}
        href={gerarUrl(numero)}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          isAtiva
            ? 'bg-medical text-white'
            : 'bg-white text-gray-700 hover:bg-medical-light hover:text-medical border border-gray-300'
        }`}
      >
        {numero}
      </Link>
    );
  };

  // Lógica para mostrar páginas (com reticências se necessário)
  const renderPaginas = () => {
    const paginas = [];
    const maxVisivel = 5; // Máximo de números visíveis

    if (totalPaginas <= maxVisivel) {
      // Mostrar todas as páginas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(renderPaginaNumero(i));
      }
    } else {
      // Mostrar com reticências
      paginas.push(renderPaginaNumero(1));

      if (paginaAtual > 3) {
        paginas.push(
          <span key="ellipsis-start" className="px-2 text-gray-500">
            ...
          </span>
        );
      }

      const inicio = Math.max(2, paginaAtual - 1);
      const fim = Math.min(totalPaginas - 1, paginaAtual + 1);

      for (let i = inicio; i <= fim; i++) {
        paginas.push(renderPaginaNumero(i));
      }

      if (paginaAtual < totalPaginas - 2) {
        paginas.push(
          <span key="ellipsis-end" className="px-2 text-gray-500">
            ...
          </span>
        );
      }

      paginas.push(renderPaginaNumero(totalPaginas));
    }

    return paginas;
  };

  return (
    <div className="flex flex-col items-center gap-6 mt-12">
      {/* Navegação de páginas */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {/* Botão Anterior */}
        {paginaAtual > 1 && (
          <Link
            href={gerarUrl(paginaAtual - 1)}
            className="px-4 py-2 bg-white text-medical border border-medical rounded-lg font-semibold hover:bg-medical hover:text-white transition-colors flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </Link>
        )}

        {/* Números de página */}
        {renderPaginas()}

        {/* Botão Próximo */}
        {paginaAtual < totalPaginas && (
          <Link
            href={gerarUrl(paginaAtual + 1)}
            className="px-4 py-2 bg-white text-medical border border-medical rounded-lg font-semibold hover:bg-medical hover:text-white transition-colors flex items-center gap-1"
          >
            Próximo
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* Informação de página */}
      <p className="text-sm text-gray-600">
        Página {paginaAtual} de {totalPaginas}
      </p>
    </div>
  );
}
