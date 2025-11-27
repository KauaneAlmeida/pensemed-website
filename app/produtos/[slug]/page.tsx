import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';
import { getProdutoBySlug } from '@/lib/api';
import { getWhatsAppProdutoLink } from '@/lib/whatsapp';

interface ProdutoPageProps {
  params: {
    slug: string;
  };
}

// Gerar metadata dinâmica para SEO
export async function generateMetadata({ params }: ProdutoPageProps): Promise<Metadata> {
  const produto = await getProdutoBySlug(params.slug);

  if (!produto) {
    return {
      title: 'Produto não encontrado - PenseMed',
    };
  }

  return {
    title: `${produto.nome} - PenseMed`,
    description: produto.descricao_curta,
  };
}

export default async function ProdutoPage({ params }: ProdutoPageProps) {
  const produto = await getProdutoBySlug(params.slug);

  // Se o produto não existir, retorna 404
  if (!produto) {
    notFound();
  }

  const whatsappLink = getWhatsAppProdutoLink(produto.nome);

  // Formatar características em lista (assumindo que vem separado por quebras de linha ou ';')
  const caracteristicasList = produto.caracteristicas_beneficios
    ? produto.caracteristicas_beneficios.split(/\n|;/).filter((item) => item.trim())
    : [];

  const itensInclusosList = produto.itens_inclusos
    ? produto.itens_inclusos.split(/\n|;/).filter((item) => item.trim())
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm">
            <Link href="/" className="text-gray-500 hover:text-medical">
              Início
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href={`/categorias/${produto.categoria.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-500 hover:text-medical">
              {produto.categoria}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{produto.nome}</span>
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Imagem do Produto */}
          <div className="relative">
            <div className="sticky top-24">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-lg">
                {produto.imagem_url ? (
                  <Image
                    src={produto.imagem_url}
                    alt={produto.nome}
                    fill
                    className="object-contain p-8"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-medical-light to-gray-200">
                    <svg
                      className="w-32 h-32 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informações do Produto */}
          <div>
            {/* Categoria */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-medical-light text-medical text-sm font-semibold rounded-full">
                {produto.categoria}
              </span>
            </div>

            {/* Nome do Produto */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {produto.nome}
            </h1>

            {/* Códigos */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              {produto.codigo_produto && (
                <div>
                  <span className="text-gray-600">Código do Produto:</span>{' '}
                  <span className="font-semibold text-gray-900">{produto.codigo_produto}</span>
                </div>
              )}
              {produto.codigo_anvisa && (
                <div>
                  <span className="text-gray-600">Registro ANVISA:</span>{' '}
                  <span className="font-semibold text-gray-900">{produto.codigo_anvisa}</span>
                </div>
              )}
            </div>

            {/* Descrição Curta */}
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              {produto.descricao_curta}
            </p>

            {/* CTA WhatsApp Principal */}
            <div className="mb-10">
              <WhatsAppButton
                href={whatsappLink}
                label="Solicitar Orçamento por WhatsApp"
                className="w-full md:w-auto text-lg"
              />
              <p className="text-sm text-gray-600 mt-3">
                Entre em contato para conhecer as condições de locação e disponibilidade
              </p>
            </div>

            {/* Aplicação */}
            {produto.aplicacao && (
              <div className="mb-8 bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-6 h-6 text-medical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Aplicação
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {produto.aplicacao}
                </p>
              </div>
            )}

            {/* Descrição Técnica */}
            {produto.descricao_tecnica && (
              <div className="mb-8 bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-6 h-6 text-medical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Descrição Técnica
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {produto.descricao_tecnica}
                </p>
              </div>
            )}

            {/* Características e Benefícios */}
            {caracteristicasList.length > 0 && (
              <div className="mb-8 bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-medical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Características e Benefícios
                </h2>
                <ul className="space-y-2">
                  {caracteristicasList.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{item.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Itens Inclusos */}
            {itensInclusosList.length > 0 && (
              <div className="mb-8 bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-medical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  Itens Inclusos
                </h2>
                <ul className="space-y-2">
                  {itensInclusosList.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-medical mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preço de Referência */}
            {produto.preco_referencia && (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Preço de Referência
                </h2>
                <p className="text-gray-700">
                  {produto.preco_referencia}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  *Valores podem variar conforme período de locação e condições. Consulte-nos para orçamento personalizado.
                </p>
              </div>
            )}

            {/* CTA Final */}
            <div className="bg-gradient-to-br from-medical-light to-blue-50 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Interessado neste produto?
              </h3>
              <p className="text-gray-700 mb-6">
                Fale com nossa equipe e receba um orçamento personalizado com as melhores condições de locação
              </p>
              <WhatsAppButton
                href={whatsappLink}
                label="Solicitar Orçamento Agora"
                className="text-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
