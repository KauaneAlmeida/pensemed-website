import type { Metadata } from 'next';
import { Inter, Open_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600'],
  fallback: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-opensans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PenseMed - Tecnologia Hospitalar de Alta Complexidade',
  description:
    'PenseMed - Tecnologia Hospitalar de Alta Complexidade. Equipamentos de ponta para procedimentos cirúrgicos, geradores de RF, sistemas de artroscopia e mais.',
  keywords: [
    'equipamentos médicos',
    'tecnologia médica',
    'geradores RF',
    'artroscopia',
    'instrumentação cirúrgica',
    'OPME',
    'CME',
    'lasers lombar delight',
    'neuroestimuladores',
  ],
  openGraph: {
    title: 'PenseMed - Tecnologia Hospitalar que Transforma Vidas',
    description: 'Equipamentos médicos de alta complexidade para centros cirúrgicos. Geradores de RF, sistemas de artroscopia, lasers médicos e neuroestimuladores.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${openSans.variable}`}>
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
