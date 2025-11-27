import WhatsAppButton from './WhatsAppButton';
import { getWhatsAppCatalogoLink } from '@/lib/whatsapp';

interface CatalogWhatsAppCTAProps {
  nomeCategoria: string;
}

export default function CatalogWhatsAppCTA({ nomeCategoria }: CatalogWhatsAppCTAProps) {
  const whatsappLink = getWhatsAppCatalogoLink(nomeCategoria);

  return (
    <div className="bg-gradient-to-br from-medical-light to-blue-50 rounded-2xl p-8 md:p-12 text-center mt-16 border border-medical/10">
      <div className="max-w-2xl mx-auto">
        {/* Ícone */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-6 shadow-md">
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>

        {/* Título */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Quer ver o catálogo completo dessa categoria?
        </h2>

        {/* Descrição */}
        <p className="text-gray-700 text-lg mb-8 leading-relaxed">
          Fale com nossa equipe pelo WhatsApp e receba o catálogo detalhado com todos os produtos,
          condições de locação e suporte técnico especializado.
        </p>

        {/* Botão CTA */}
        <WhatsAppButton
          href={whatsappLink}
          label="Ver catálogo completo no WhatsApp"
          className="text-lg"
        />

        {/* Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 text-sm">
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Atendimento rápido</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Orçamento sem compromisso</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Suporte especializado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
