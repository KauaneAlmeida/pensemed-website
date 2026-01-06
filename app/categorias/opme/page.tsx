'use client';

import Link from 'next/link';

export default function OPMEPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-700 to-gray-800 text-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <nav className="text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Página Inicial
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white font-medium">OPME</span>
          </nav>

          {/* Badge Em Breve */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-gray-200 rounded-full text-sm font-semibold uppercase tracking-wide mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Em breve
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            OPME
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Órteses, Próteses e Materiais Especiais para procedimentos cirúrgicos
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 mb-8">
            Enquanto isso, conheça nossas outras categorias:
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {/* Equipamentos Médicos */}
            <Link
              href="/equipamentos-medicos"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#00d4ff] text-white rounded-lg font-medium hover:bg-[#00b8e6] transition-colors w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Equipamentos Médicos
            </Link>

            {/* Instrumentação CME */}
            <Link
              href="/instrumentacao-cme"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#2a4a73] transition-colors w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Instrumentação CME
            </Link>
          </div>

          {/* Botão Voltar */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Início
          </Link>
        </div>
      </section>
    </div>
  );
}
