'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getWhatsAppGenericLink } from '@/lib/whatsapp';
import { CATEGORIAS_MAP } from '@/lib/types';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import CountUp from '@/components/CountUp';

export default function HomePage() {
  const whatsappLink = getWhatsAppGenericLink();

  // Produtos em destaque
  const produtosDestaque = [
    {
      nome: 'Gerador de RF',
      descricao: 'Sistema avançado de radiofrequência para procedimentos minimamente invasivos',
      imagem: '/images/RF_Generator_product_image_415d4883-DqpPLcgK.png',
    },
    {
      nome: 'Sistema de Artroscopia',
      descricao: 'Bomba de artroscopia de alta performance para procedimentos ortopédicos',
      imagem: '/images/Arthroscopy_pump_product_image_778ced89-psRa64Q_.png',
    },
    {
      nome: 'Laser Lombar Delight',
      descricao: 'Tecnologia laser aplicada a procedimentos de bloqueio da dor com precisão e segurança.',
      imagem: '/images/Medical_laser_device_image_4336ead2-CjiKD-CB.png',
    },
    {
      nome: 'Neuroestimulador',
      descricao: 'Sistema de neuroestimulação desenvolvido para suporte a procedimentos de anestesia regional.',
      imagem: '/images/Neurostimulator_device_image_935f0152-m3mVQPtj.png',
    },
  ];

  // Categorias com ícones
  const categoriasComIcones = [
    {
      ...CATEGORIAS_MAP['equipamentos-medicos'],
      href: '/equipamentos-medicos',
    },
    {
      ...CATEGORIAS_MAP['instrumentacao-cirurgica-cme'],
      href: '/instrumentacao-cme',
    },
    {
      ...CATEGORIAS_MAP['opme'],
      href: '/categorias/opme',
    },
  ];

  // Diferenciais data
  const diferenciais = [
    {
      iconPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      title: 'Equipamentos Certificados',
      description: 'Produtos homologados e certificados pelas principais agências reguladoras',
    },
    {
      iconPath: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
      title: 'Tecnologia de Ponta',
      description: 'Soluções inovadoras com tecnologia de última geração para procedimentos complexos',
    },
    {
      iconPath: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
      title: 'Suporte Especializado',
      description: 'Equipe técnica altamente qualificada para treinamento e assistência completa',
    },
    {
      iconPath: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
      title: 'Logística Integrada',
      description: 'Sistema completo de entrega, instalação e manutenção preventiva',
    },
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section - FIXO no fundo (fica parado enquanto conteúdo sobe) */}
      <section className="fixed inset-0 h-screen min-h-[600px] w-full flex items-center justify-center overflow-hidden z-0">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/Surgical_suite_hero_background_1990b8e6-D6XnlbNF.png"
            alt="Centro Cirúrgico"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay gradiente - tons da paleta PenseMed */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#09354d]/90 via-[#09354d]/80 to-[#205b67]/75" />
          {/* Camada adicional para reforçar a cor */}
          <div className="absolute inset-0 bg-[#09354d]/35" />
        </div>

        {/* Padrão decorativo */}
        <div className="absolute inset-0 z-[1] opacity-5">
          <Image
            src="/images/Medical_technology_pattern_background_4134cf13-DIFvAmOj.png"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        {/* Gradiente inferior sutil */}
        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-[#09354d]/50 to-transparent z-[2] pointer-events-none" />

        {/* Conteúdo do Hero - Centralizado */}
        <div className="relative z-10 w-full h-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-center">
          {/* Bloco de texto centralizado */}
          <div className="flex flex-col items-center text-center">
            {/* Título principal */}
            <h1 className="font-semibold sm:font-medium mb-8 leading-[1.05] tracking-[-0.03em] animate-fade-in-up">
              <span className="block text-white/95 text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                Tecnologia Médica que
              </span>
              <span className="block text-[#4fd1c5] text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mt-1 sm:mt-2">
                Transforma Vidas
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/75 mb-10 sm:mb-12 max-w-2xl leading-relaxed animate-fade-in-up animation-delay-200">
              Equipamentos de ponta para procedimentos de alta precisão.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto justify-center animate-fade-in-up animation-delay-400">
              <a
                href="#nossos-equipamentos"
                className="group inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 bg-white text-[#09354d] hover:bg-gray-100 rounded-lg font-medium text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Explore Nosso Portfólio
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 text-white/90 font-medium text-base sm:text-lg transition-all duration-300 border border-white/30 rounded-lg hover:border-white/50 hover:bg-white/5"
              >
                Solicite uma Consultoria
              </a>
            </div>

          </div>
        </div>

        {/* Ícone de mouse/scroll indicator */}
        <div className="absolute bottom-16 sm:bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 animate-fade-in animation-delay-600">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center mx-auto">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Spacer - ocupa o espaço do Hero fixo no fluxo do documento */}
      <div className="h-screen min-h-[600px]" />

      {/* Conteúdo que sobe por cima do Hero ao fazer scroll */}
      <div className="relative z-10">
        {/* Seção de Diferenciais - Por Que Escolher */}
        <section className="py-16 sm:py-20 md:py-24 bg-gray-50 rounded-t-[2rem] sm:rounded-t-[3rem]" style={{ boxShadow: '0 -20px 60px -15px rgba(0,0,0,0.2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-10 sm:mb-14 lg:mb-16">
            <AnimateOnScroll animation="fade-up" duration={800}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-[#111] mb-4 sm:mb-6 tracking-[-0.025em]">
                Por Que Escolher a PenseMed?
              </h2>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={200} duration={800}>
              <p className="text-base sm:text-lg md:text-xl text-[#555] max-w-2xl mx-auto leading-relaxed">
                Compromisso com excelência e inovação em cada equipamento
              </p>
            </AnimateOnScroll>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {diferenciais.map((diferencial, index) => (
              <AnimateOnScroll
                key={index}
                animation="fade-up"
                delay={400 + index * 150}
                duration={800}
              >
                <div className="h-full flex flex-col items-center text-center p-3 sm:p-5 md:p-6 bg-white rounded-lg sm:rounded-xl border border-[#205b67]/30 hover:shadow-lg transition-shadow duration-300">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#205b67]/10 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-7 sm:h-7 text-[#205b67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={diferencial.iconPath} />
                    </svg>
                  </div>
                  <h3 className="text-xs sm:text-lg font-medium text-[#111] mb-1 sm:mb-2 tracking-[-0.015em] line-clamp-2">{diferencial.title}</h3>
                  <p className="text-[10px] sm:text-sm text-[#555] leading-relaxed line-clamp-3 sm:line-clamp-none">{diferencial.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Produtos em Destaque */}
      <section className="relative py-16 sm:py-20 md:py-24 bg-white overflow-hidden">
          {/* Imagem de ondas decorativa no fundo */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Image
              src="/images/waves-bg.png"
              alt=""
              fill
              className="object-cover opacity-25"
              sizes="100vw"
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <AnimateOnScroll animation="fade-up" duration={800}>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-[#111] mb-4 sm:mb-6 tracking-[-0.025em]">
                  Equipamentos de Alta Tecnologia
                </h2>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={200} duration={800}>
                <p className="text-base sm:text-lg md:text-xl text-[#555] max-w-2xl mx-auto leading-relaxed">
                  Conheça nossa linha completa de equipamentos médicos de última geração
                </p>
              </AnimateOnScroll>
            </div>

            {/* Grid de Produtos - 2 colunas em mobile para cards menores */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {produtosDestaque.map((produto, index) => (
                <AnimateOnScroll
                  key={index}
                  animation="fade-up"
                  delay={300 + index * 150}
                  duration={800}
                >
                  <div className="group bg-white rounded-lg sm:rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden h-full flex flex-col">
                    <div className="aspect-square sm:aspect-[4/3] relative overflow-hidden bg-gray-50 p-2 sm:p-6">
                      <Image
                        src={produto.imagem}
                        alt={produto.nome}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-500 p-1 sm:p-2"
                      />
                    </div>
                    <div className="p-2.5 sm:p-5 flex flex-col flex-grow bg-white">
                      <h3 className="text-xs sm:text-lg font-medium text-[#111] mb-1 sm:mb-2 tracking-[-0.015em] line-clamp-2">{produto.nome}</h3>
                      <p className="text-[#555] text-[10px] sm:text-sm leading-relaxed flex-grow line-clamp-2 sm:line-clamp-none">{produto.descricao}</p>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>

            {/* CTA Ver todos */}
            <AnimateOnScroll animation="fade-in" delay={800} duration={700}>
              <div className="relative z-10 text-center mt-10 sm:mt-12 lg:mt-14">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center justify-center gap-2 sm:gap-3 px-8 py-4 bg-[#205b67] hover:bg-[#2a7a8a] text-white rounded-lg font-medium text-base sm:text-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  Ver Catálogo Completo
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Seção de Categorias */}
        <section id="nossos-equipamentos" className="py-16 sm:py-20 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <AnimateOnScroll animation="fade-up" duration={800}>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-[#111] mb-4 sm:mb-6 tracking-[-0.025em]">
                  Nossos Equipamentos
                </h2>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={200} duration={800}>
                <p className="text-base sm:text-lg md:text-xl text-[#555] max-w-2xl mx-auto leading-relaxed">
                  Tecnologia de ponta para procedimentos de alta complexidade
                </p>
              </AnimateOnScroll>
            </div>

            {/* Grid de Categorias */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
              {categoriasComIcones.map((categoria, index) => (
                  <AnimateOnScroll
                    key={categoria.slug}
                    animation="fade-up"
                    delay={300 + index * 180}
                    duration={800}
                  >
                    <Link href={categoria.href} className="group block h-full">
                        <div className="bg-gradient-to-br from-[#09354d] to-[#205b67] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 h-full flex flex-col transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 relative">
                          <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-[#4fd1c5]/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-6">
                            <svg className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-[#4fd1c5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          </div>
                          <h3 className="text-xl sm:text-2xl lg:text-2xl font-medium text-white/95 mb-3 sm:mb-4 tracking-[-0.02em]">{categoria.nome}</h3>
                          <p className="text-sm sm:text-base text-gray-400 mb-5 sm:mb-6 leading-relaxed flex-grow">{categoria.descricao}</p>
                          <div className="flex items-center gap-2 text-[#4fd1c5] font-medium text-sm sm:text-base">
                            <span>Ver produtos</span>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                  </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Seção de Números/Estatísticas */}
        <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
          {/* Fundo gradiente paleta PenseMed */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#09354d] via-[#0d4a6b] to-[#205b67]" />
          {/* Padrão decorativo sutil */}
          <div className="absolute inset-0 opacity-5">
            <Image
              src="/images/Medical_technology_pattern_background_4134cf13-DIFvAmOj.png"
              alt=""
              fill
              className="object-cover"
            />
          </div>
          {/* Gradiente de brilho sutil no topo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#2a7a8a]/10 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <AnimateOnScroll animation="fade-up" duration={800}>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white/95 mb-4 sm:mb-6 tracking-[-0.025em]">
                  Números que Inspiram Confiança
                </h2>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={150} duration={800}>
                <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
                  Nossa trajetória de excelência em números
                </p>
              </AnimateOnScroll>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
              <AnimateOnScroll animation="fade-up" delay={200} duration={800}>
                <div className="text-center p-6 sm:p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#4fd1c5] mb-2 sm:mb-3">
                    <CountUp end={500} duration={2000} suffix="+" />
                  </div>
                  <p className="text-sm sm:text-base text-white/80 font-medium">
                    Equipamentos Fornecidos
                  </p>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={300} duration={800}>
                <div className="text-center p-6 sm:p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#4fd1c5] mb-2 sm:mb-3">
                    <CountUp end={100} duration={2000} suffix="+" />
                  </div>
                  <p className="text-sm sm:text-base text-white/80 font-medium">
                    Hospitais Atendidos
                  </p>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={400} duration={800}>
                <div className="text-center p-6 sm:p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#4fd1c5] mb-2 sm:mb-3">
                    <CountUp end={15} duration={2000} />
                  </div>
                  <p className="text-sm sm:text-base text-white/80 font-medium">
                    Anos de Experiência
                  </p>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={500} duration={800}>
                <div className="text-center p-6 sm:p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#4fd1c5] mb-2 sm:mb-3">
                    <CountUp end={98} duration={2000} suffix="%" />
                  </div>
                  <p className="text-sm sm:text-base text-white/80 font-medium">
                    Satisfação dos Clientes
                  </p>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="relative py-16 sm:py-20 md:py-28 lg:py-32 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#09354d] to-[#205b67]" />
            <div className="absolute inset-0 opacity-10">
              <Image
                src="/images/Medical_technology_pattern_background_4134cf13-DIFvAmOj.png"
                alt=""
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <AnimateOnScroll animation="fade-up" duration={800}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white/95 mb-4 sm:mb-6 leading-tight tracking-[-0.025em]">
                Pronto para elevar o padrão do seu centro cirúrgico?
              </h2>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={200} duration={800}>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
                Entre em contato conosco e descubra como podemos ajudar sua instituição com equipamentos de última geração
              </p>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={400} duration={800}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Botão Principal - Solicitar Orçamento */}
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-white hover:bg-gray-100 text-[#09354d] rounded-lg font-medium text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Solicitar Orçamento
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                {/* Botão Secundário - Falar com a Nossa Equipe */}
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-transparent border-2 border-white/40 text-white/90 hover:bg-white/10 hover:border-white/60 rounded-lg font-medium text-base sm:text-lg transition-all duration-300"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Falar com a Nossa Equipe
                </a>
              </div>
            </AnimateOnScroll>
          </div>
      </section>
      </div>{/* Fecha o container relative z-10 */}

      {/* WhatsApp Flutuante */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Contato via WhatsApp"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
