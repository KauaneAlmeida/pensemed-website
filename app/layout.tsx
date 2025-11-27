import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PenseMed - Locação de Equipamentos Médicos e OPME',
  description:
    'Especialistas em locação de equipamentos médicos, instrumentação cirúrgica CME e OPME. Soluções completas para hospitais, clínicas e profissionais da saúde.',
  keywords: [
    'locação equipamentos médicos',
    'instrumentação cirúrgica',
    'OPME',
    'equipamentos hospitalares',
    'CME',
    'materiais médicos',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
