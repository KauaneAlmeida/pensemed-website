import Link from 'next/link';
import Image from 'next/image';
import { GrupoInstrumentoCME, tabelaToSlug } from '@/lib/types';

interface InstrumentoGrupoCardProps {
  grupo: GrupoInstrumentoCME;
  slugCaixa: string;
}

export default function InstrumentoGrupoCard({ grupo, slugCaixa }: InstrumentoGrupoCardProps) {
  const primeiroInstrumento = grupo.instrumentos[0];

  // Gerar slug para o grupo baseado no nome base
  const slugGrupo = tabelaToSlug(grupo.nomeBase);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 overflow-hidden group">
      {/* Imagem do Instrumento - mais compacta */}
      <div className="relative h-40 bg-gray-50 overflow-hidden">
        {primeiroInstrumento.imagem_url ? (
          <Image
            src={primeiroInstrumento.imagem_url}
            alt={grupo.nomeBase}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
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

        {/* Badge de variações */}
        <div className="absolute top-2 right-2 bg-medical text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {grupo.instrumentos.length} var.
        </div>
      </div>

      {/* Conteúdo do Card - mais compacto */}
      <div className="p-3">
        {/* Código do primeiro produto */}
        <p className="text-xs text-medical font-medium mb-1">
          {primeiroInstrumento.codigo}+
        </p>

        {/* Nome do Grupo */}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {grupo.nomeBase}
        </h3>

        {/* Botão Ver Detalhes - mais compacto */}
        <Link
          href={`/instrumentacao-cme/${slugCaixa}/conjunto/${slugGrupo}`}
          className="block w-full text-center px-3 py-2 bg-medical hover:bg-medical-dark text-white rounded-md text-sm font-medium transition-colors duration-200"
        >
          Ver Opções
        </Link>
      </div>
    </div>
  );
}
