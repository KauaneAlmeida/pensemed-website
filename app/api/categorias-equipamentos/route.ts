import { NextResponse } from 'next/server';
import { getCategoriasEquipamentosCached } from '@/lib/api';

// ISR: revalidar a cada 10 minutos
export const revalidate = 600;

export async function GET() {
  try {
    const categorias = await getCategoriasEquipamentosCached();
    return NextResponse.json(categorias, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('[API /categorias-equipamentos] Erro:', error);
    return NextResponse.json([], { status: 500 });
  }
}
