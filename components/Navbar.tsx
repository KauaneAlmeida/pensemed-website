'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

  // Navbar transparente na home sem scroll, com fundo ao scrollar ou em outras páginas
  const mostrarFundo = !temHero || isScrolled;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: mostrarFundo ? 'rgba(9, 53, 77, 0.95)' : 'transparent',
        backdropFilter: mostrarFundo ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: mostrarFundo ? 'blur(12px)' : 'none',
        boxShadow: mostrarFundo ? '0 4px 30px rgba(0, 0, 0, 0.1)' : 'none',
      }}
    >
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-between items-center h-20 md:h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/Logo.png"
              alt="PenseMed - Tecnologia Hospitalar"
              width={220}
              height={220}
              priority
              className="w-[160px] sm:w-[180px] md:w-[220px] h-auto brightness-0 invert"
            />
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              className={`transition-colors font-medium text-base lg:text-lg ${
                pathname === '/' ? 'text-white' : 'text-white/80 hover:text-white'
              }`}
            >
              Início
            </Link>
            <Link
              href="/catalogo"
              className={`transition-colors font-medium text-base lg:text-lg ${
                pathname === '/catalogo' ? 'text-white' : 'text-white/80 hover:text-white'
              }`}
            >
              Catálogo
            </Link>
            <Link
              href="/equipamentos-medicos"
              className={`transition-colors font-medium text-base lg:text-lg ${
                pathname.startsWith('/equipamentos') ? 'text-white' : 'text-white/80 hover:text-white'
              }`}
            >
              Portfólio
            </Link>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors font-medium text-base lg:text-lg"
            >
              Contato
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 bg-white hover:bg-gray-100 text-[#09354d]"
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
          <div className="md:hidden bg-[#09354d]/95 backdrop-blur-sm rounded-lg mt-2 py-5">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className={`transition-colors font-medium text-lg px-5 py-3 ${
                  pathname === '/' ? 'text-white' : 'text-white/80 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                href="/catalogo"
                className={`transition-colors font-medium text-lg px-5 py-3 ${
                  pathname === '/catalogo' ? 'text-white' : 'text-white/80 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Catálogo
              </Link>
              <Link
                href="/equipamentos-medicos"
                className={`transition-colors font-medium text-lg px-5 py-3 ${
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
                className="text-white/80 hover:text-white transition-colors font-medium text-lg px-5 py-3"
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center mx-5 mt-2 px-6 py-4 bg-white hover:bg-gray-100 text-[#09354d] rounded-lg font-semibold text-base transition-all duration-200"
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
