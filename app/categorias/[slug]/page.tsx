import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProductGrid from '@/components/ProductGrid';
import CatalogWhatsAppCTA from '@/components/CatalogWhatsAppCTA';
import { getProdutosByCategoriaSlug } from '@/lib/api';
import { getCategoriaBySlug, CATEGORIAS_MAP } from '@/lib/types';

interface CategoriaPageProps {
  params: {
    slug: string;
  };
}

// Gerar metadata dinâmica para SEO
export async function generateMetadata({ params }: CategoriaPageProps): Promise<Metadata> {
  const categoria = getCategoriaBySlug(params.slug);

  if (!categoria) {
    return {
      title: 'Categoria não encontrada - PenseMed',
    };
  }

  return {
    title: `${categoria.nome} - PenseMed`,
    description: categoria.descricao,
  };
}

// Gerar rotas estáticas em build time
// Exclui 'opme' pois tem página dedicada em /categorias/opme
export async function generateStaticParams() {
  const slugs = Object.keys(CATEGORIAS_MAP).filter(slug => slug !== 'opme');
  return slugs.map((slug) => ({ slug }));
}

export default async function CategoriaPage({ params }: CategoriaPageProps) {
  // Redireciona OPME para página dedicada
  if (params.slug === 'opme') {
    const { redirect } = await import('next/navigation');
    redirect('/categorias/opme');
  }

  const categoria = getCategoriaBySlug(params.slug);

  // Se a categoria não existir, retorna 404
  if (!categoria) {
    notFound();
  }

  // Buscar produtos da categoria
  const produtos = await getProdutosByCategoriaSlug(params.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Categoria */}
      <section className="bg-gradient-to-br from-medical to-medical-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {categoria.nome}
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-2">
              {categoria.descricao}
            </p>
            <p className="text-lg text-white/70">
              {categoria.destaque}
            </p>
          </div>
        </div>
      </section>

      {/* Grid de Produtos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contador de produtos */}
        {produtos.length > 0 && (
          <div className="mb-8">
            <p className="text-gray-600">
              <span className="font-semibold text-medical">{produtos.length}</span>{' '}
              {produtos.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </p>
          </div>
        )}

        {/* Grid */}
        <ProductGrid produtos={produtos} />

        {/* CTA WhatsApp */}
        <CatalogWhatsAppCTA nomeCategoria={categoria.nome} />
      </section>
    </div>
  );
}
