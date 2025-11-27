import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';
import { getWhatsAppGenericLink } from '@/lib/whatsapp';
import { CATEGORIAS_MAP } from '@/lib/types';

export default function HomePage() {
  const categorias = Object.values(CATEGORIAS_MAP);
  const whatsappLink = getWhatsAppGenericLink();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-medical to-medical-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              PenseMed
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-blue-100">
              Locação de Equipamentos Médicos e OPME
            </p>
            <p className="text-lg md:text-xl mb-10 text-blue-50 max-w-3xl mx-auto">
              Soluções completas em equipamentos médicos hospitalares, instrumentação cirúrgica e
              materiais especiais. Atendemos hospitais, clínicas e profissionais da saúde com
              excelência e suporte técnico especializado.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/categorias/equipamentos-medicos"
                className="inline-flex items-center px-8 py-4 bg-white text-medical hover:bg-gray-100 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Ver Catálogo de Equipamentos
              </Link>
              <WhatsAppButton
                href={whatsappLink}
                label="Falar no WhatsApp"
                variant="secondary"
                className="px-8 py-4 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categorias Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nossas Categorias
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Escolha a categoria de produtos que você precisa e conheça nossas soluções
          </p>
        </div>

        {/* Grid de Categorias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categorias.map((categoria) => (
            <Link
              key={categoria.slug}
              href={`/categorias/${categoria.slug}`}
              className="group"
            >
              <div className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden h-full transform group-hover:scale-105">
                {/* Ícone/Header da Categoria */}
                <div className="bg-gradient-to-br from-medical-light to-blue-100 p-8 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-md">
                    <svg
                      className="w-10 h-10 text-medical"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {categoria.nome}
                  </h3>
                </div>

                {/* Conteúdo da Categoria */}
                <div className="p-6">
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {categoria.descricao}
                  </p>
                  <p className="text-sm text-medical font-semibold">
                    {categoria.destaque}
                  </p>

                  {/* Call to Action */}
                  <div className="mt-6 flex items-center text-medical font-semibold group-hover:gap-2 transition-all">
                    <span>Explorar categoria</span>
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
          ))}
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher a PenseMed?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefício 1 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-medical-light rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-medical"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Equipamentos Certificados
              </h3>
              <p className="text-gray-600">
                Todos os equipamentos com certificação ANVISA e manutenção preventiva em dia
              </p>
            </div>

            {/* Benefício 2 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-medical-light rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-medical"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Suporte Técnico 24/7
              </h3>
              <p className="text-gray-600">
                Equipe técnica especializada disponível para atendimento rápido e eficiente
              </p>
            </div>

            {/* Benefício 3 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-medical-light rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-medical"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Entrega Rápida
              </h3>
              <p className="text-gray-600">
                Logística ágil e eficiente para garantir que você tenha o equipamento quando precisar
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-br from-medical-light to-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pronto para locação?
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Entre em contato conosco e receba um atendimento personalizado para suas necessidades
          </p>
          <WhatsAppButton
            href={whatsappLink}
            label="Falar com nossa equipe"
            className="text-lg"
          />
        </div>
      </section>
    </div>
  );
}
