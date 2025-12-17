'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getWhatsAppGenericLink } from '@/lib/whatsapp';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const whatsappLink = getWhatsAppGenericLink();
  const pathname = usePathname();

  // Páginas que têm hero escuro (navbar transparente)
  const paginasComHero = ['/', '/sobre'];
  const temHero = paginasComHero.includes(pathname);

  // Detectar scroll para mudar fundo do navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Verificar estado inicial

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determinar se deve usar fundo sólido
  const usarFundoSolido = !temHero || isScrolled;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      usarFundoSolido
        ? 'bg-medical-dark shadow-lg'
        : 'bg-transparent'
    }`}>
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            {/* Ícone PM */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              usarFundoSolido ? 'bg-white/20' : 'bg-medical-dark'
            } text-white`}>
              <span className="font-bold text-lg">PM</span>
            </div>
            {/* Nome e subtítulo */}
            <div className="hidden sm:block">
              <div className="text-white font-bold text-xl leading-tight">PenseMedical</div>
              <div className="text-white/70 text-xs">Tecnologia Médica</div>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`transition-colors font-medium ${
                pathname === '/' ? 'text-white' : 'text-white/80 hover:text-white'
              }`}
            >
              Início
            </Link>
            <Link
              href="/catalogo"
              className={`transition-colors font-medium ${
                pathname === '/catalogo' ? 'text-white' : 'text-white/80 hover:text-white'
              }`}
            >
              Catálogo
            </Link>
            <Link
              href="/equipamentos-medicos"
              className={`transition-colors font-medium ${
                pathname.startsWith('/equipamentos') ? 'text-white' : 'text-white/80 hover:text-white'
              }`}
            >
              Portfólio
            </Link>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Contato
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 bg-white hover:bg-gray-100 text-medical-dark"
            >
              Solicitar Orçamento
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden text-white/80 hover:text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-medical-dark/95 backdrop-blur-sm rounded-lg mt-2 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className={`transition-colors font-medium px-4 py-2 ${
                  pathname === '/' ? 'text-white' : 'text-white/80 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                href="/catalogo"
                className={`transition-colors font-medium px-4 py-2 ${
                  pathname === '/catalogo' ? 'text-white' : 'text-white/80 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Catálogo
              </Link>
              <Link
                href="/equipamentos-medicos"
                className={`transition-colors font-medium px-4 py-2 ${
                  pathname.startsWith('/equipamentos') ? 'text-white' : 'text-white/80 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Portfólio
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white transition-colors font-medium px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center mx-4 px-6 py-3 bg-white hover:bg-gray-100 text-medical-dark rounded-lg font-semibold text-sm transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Solicitar Orçamento
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
