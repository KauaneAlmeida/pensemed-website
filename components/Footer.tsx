import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sobre */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              Pense<span className="text-blue-400">Med</span>
            </h3>
            <p className="text-gray-400 text-sm">
              Especialistas em locação de equipamentos médicos, instrumentação cirúrgica e OPME.
              Soluções completas para hospitais, clínicas e profissionais da saúde.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/categorias/equipamentos-medicos"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Equipamentos Médicos
                </Link>
              </li>
              <li>
                <Link
                  href="/categorias/instrumentacao-cirurgica-cme"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Instrumentação Cirúrgica CME
                </Link>
              </li>
              <li>
                <Link
                  href="/categorias/opme"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  OPME
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contato</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Segunda a Sexta: 8h às 18h</p>
              <p>Sábado: 8h às 12h</p>
              <p className="mt-4">Atendimento via WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} PenseMed. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
