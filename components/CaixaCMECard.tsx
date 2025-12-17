import Link from 'next/link';
import Image from 'next/image';
import { CaixaCME } from '@/lib/types';

interface CaixaCMECardProps {
  caixa: CaixaCME;
}

export default function CaixaCMECard({ caixa }: CaixaCMECardProps) {
  return (
    <Link
      href={`/instrumentacao-cme/${caixa.slug}`}
      className="group block"
    >
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full transform group-hover:scale-105">
        {/* Imagem da Caixa */}
        <div className="relative h-64 bg-gray-100 overflow-hidden">
          {caixa.imagem_url ? (
            <Image
              src={caixa.imagem_url}
              alt={caixa.nome_exibicao}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-medical-light to-gray-200">
              <svg
                className="w-24 h-24 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Conteúdo do Card */}
        <div className="p-6">
          {/* Nome da Caixa */}
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {caixa.nome_exibicao}
          </h3>

          {/* Contador de Instrumentos */}
          <div className="flex items-center gap-2 text-medical mb-4">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            <span className="font-semibold">
              {caixa.total_instrumentos} {caixa.total_instrumentos === 1 ? 'instrumento' : 'instrumentos'}
            </span>
          </div>

          {/* Call to Action */}
          <div className="flex items-center text-medical font-semibold group-hover:gap-2 transition-all">
            <span>Ver instrumentos</span>
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
