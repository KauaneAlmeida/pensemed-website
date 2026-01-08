import Link from 'next/link';
import Image from 'next/image';
import { InstrumentoCME, codigoValido } from '@/lib/types';

interface InstrumentoCMECardProps {
  instrumento: InstrumentoCME;
  slugCaixa: string; // Slug da caixa/tabela para routing
}

export default function InstrumentoCMECard({ instrumento, slugCaixa }: InstrumentoCMECardProps) {

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 overflow-hidden group">
      {/* Imagem do Instrumento - mais compacta */}
      <div className="relative h-40 bg-gray-50 overflow-hidden">
        {instrumento.imagem_url ? (
          <Image
            src={instrumento.imagem_url}
            alt={`${instrumento.categoria} - ${instrumento.codigo}`}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#205b67]/10 to-gray-100">
            <svg
              className="w-12 h-12 text-gray-300"
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
          </div>
        )}
      </div>

      {/* Conteúdo do Card - mais compacto */}
      <div className="p-3">
        {/* Código do Produto (só mostra se for código válido) */}
        {codigoValido(instrumento.codigo) && (
          <p className="text-xs text-medical font-medium mb-1">
            {instrumento.codigo}
          </p>
        )}

        {/* Nome do Instrumento */}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {instrumento.nome}
        </h3>

        {/* Botão Ver Detalhes - mais compacto */}
        <Link
          href={`/instrumentacao-cme/${slugCaixa}/${instrumento.codigo}`}
          className="block w-full text-center px-3 py-2 bg-medical hover:bg-medical-dark text-white rounded-md text-sm font-medium transition-colors duration-200"
        >
          Ver Detalhes
        </Link>
      </div>
    </div>
  );
}
