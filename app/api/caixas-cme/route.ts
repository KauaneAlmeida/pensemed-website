import { NextResponse } from 'next/server';
import { getCaixasCMECached } from '@/lib/api';

// ISR: revalidar a cada 10 minutos
export const revalidate = 600;

export async function GET() {
  try {
    const caixas = await getCaixasCMECached();
    return NextResponse.json(caixas, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('[API /caixas-cme] Erro:', error);
    return NextResponse.json([], { status: 500 });
  }
}
