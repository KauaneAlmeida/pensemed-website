'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProdutoOPME } from '@/lib/types';

// Componente de loading
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-12 bg-emerald-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para seção de informações
function InfoSection({
  title,
  content,
  icon
}: {
  title: string;
  content: string | null | undefined;
  icon: React.ReactNode;
}) {
  if (!content) return null;

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-emerald-600">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 whitespace-pre-line">{content}</p>
    </div>
  );
}

export default function OPMEDetailPage({
  params
}: {
  params: { id: string }
}) {
  const [produto, setProduto] = useState<ProdutoOPME | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduto = async () => {
      try {
        const response = await fetch(`/api/opme/${params.id}`);

        if (!response.ok) {
          throw new Error('Produto não encontrado');
        }

        const data = await response.json();
        setProduto(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduto();
  }, [params.id]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !produto) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h1>
            <p className="text-gray-600 mb-6">O produto que você está procurando não existe ou foi removido.</p>
            <Link
              href="/categorias/opme"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para OPME
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Gerar mensagem para WhatsApp
  const mensagemWhatsApp = encodeURIComponent(
    `Olá! Tenho interesse no produto OPME:\n\n` +
    `*${produto.nome}*\n` +
    `Categoria: ${produto.categoria || 'N/A'}\n` +
    (produto.fabricante ? `Fabricante: ${produto.fabricante}\n` : '') +
    (produto.registro_anvisa ? `Registro ANVISA: ${produto.registro_anvisa}\n` : '') +
    `\nGostaria de mais informações sobre disponibilidade e valores.`
  );

  const whatsappLink = `https://wa.me/5511999999999?text=${mensagemWhatsApp}`;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Início
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/categorias/opme" className="text-emerald-600 hover:text-emerald-700">
              OPME
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 truncate max-w-[200px]">{produto.nome}</span>
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Imagem do Produto */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              {produto.imagem_url ? (
                <Image
                  src={produto.imagem_url}
                  alt={produto.nome}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-24 h-24 text-gray-300 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm mt-2 block">Imagem não disponível</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações do Produto */}
          <div className="flex flex-col">
            {/* Categoria Badge */}
            {produto.categoria && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 w-fit mb-4">
                {produto.categoria}
              </span>
            )}

            {/* Nome do Produto */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {produto.nome}
            </h1>

            {/* Informações Rápidas */}
            <div className="flex flex-wrap gap-4 mb-6">
              {produto.fabricante && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span><strong>Fabricante:</strong> {produto.fabricante}</span>
                </div>
              )}
              {produto.registro_anvisa && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span><strong>ANVISA:</strong> {produto.registro_anvisa}</span>
                </div>
              )}
              {produto.uso_unico !== null && produto.uso_unico !== undefined && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span><strong>Uso:</strong> {produto.uso_unico ? 'Uso Único' : 'Reutilizável'}</span>
                </div>
              )}
            </div>

            {/* Descrição */}
            {produto.descricao && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-600 whitespace-pre-line">{produto.descricao}</p>
              </div>
            )}

            {/* CTA WhatsApp */}
            <div className="mt-auto pt-6">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Solicitar Orçamento
              </a>
              <p className="text-sm text-gray-500 mt-3 text-center sm:text-left">
                Clique para falar diretamente com nossa equipe
              </p>
            </div>
          </div>
        </div>

        {/* Seções de Informações Adicionais */}
        <div className="mt-8 lg:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <InfoSection
            title="Aplicação"
            content={produto.aplicacao}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
          />

          <InfoSection
            title="Especificações Técnicas"
            content={produto.especificacoes_tecnicas}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />

          <InfoSection
            title="Modelos Disponíveis"
            content={produto.modelos}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />

          <InfoSection
            title="Características"
            content={produto.caracteristicas}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
          />

          <InfoSection
            title="Compatibilidade"
            content={produto.compatibilidade}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
          />

          <InfoSection
            title="Esterilização"
            content={produto.esterilizacao}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />

          {produto.validade && (
            <InfoSection
              title="Validade"
              content={produto.validade}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
