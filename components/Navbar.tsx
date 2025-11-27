import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-medical-dark">
              Pense<span className="text-medical">Med</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-medical transition-colors"
            >
              Início
            </Link>
            <Link
              href="/categorias/equipamentos-medicos"
              className="text-gray-700 hover:text-medical transition-colors"
            >
              Equipamentos Médicos
            </Link>
            <Link
              href="/categorias/instrumentacao-cirurgica-cme"
              className="text-gray-700 hover:text-medical transition-colors"
            >
              Instrumentação CME
            </Link>
            <Link
              href="/categorias/opme"
              className="text-gray-700 hover:text-medical transition-colors"
            >
              OPME
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700 hover:text-medical"
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
