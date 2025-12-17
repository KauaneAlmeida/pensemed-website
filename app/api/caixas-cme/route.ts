import { NextResponse } from 'next/server';
import { getCaixasCME } from '@/lib/api';

export async function GET() {
  try {
    const caixas = await getCaixasCME();
    return NextResponse.json(caixas);
  } catch (error) {
    console.error('[API /caixas-cme] Erro:', error);
    return NextResponse.json([], { status: 500 });
  }
}
