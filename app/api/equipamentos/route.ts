import { NextRequest, NextResponse } from 'next/server';
import { getEquipamentosDaTabelaCached } from '@/lib/api';

// Dinâmico porque usa searchParams, mas com cache na função e headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tabela = searchParams.get('tabela');
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const porPagina = parseInt(searchParams.get('porPagina') || '100');

    if (!tabela) {
      return NextResponse.json(
        { error: 'Parâmetro "tabela" é obrigatório' },
        { status: 400 }
      );
    }

    const resultado = await getEquipamentosDaTabelaCached(tabela, pagina, porPagina);

    return NextResponse.json(resultado, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API /equipamentos] Erro:', error);
    return NextResponse.json(
      { equipamentos: [], total: 0, totalPaginas: 0 },
      { status: 500 }
    );
  }
}
