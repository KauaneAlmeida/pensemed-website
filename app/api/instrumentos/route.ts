import { NextRequest, NextResponse } from 'next/server';
import { getInstrumentosDaTabelaCached } from '@/lib/api';

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

    const resultado = await getInstrumentosDaTabelaCached(tabela, pagina, porPagina);

    return NextResponse.json(resultado, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API /instrumentos] Erro:', error);
    return NextResponse.json(
      { instrumentos: [], total: 0, totalPaginas: 0 },
      { status: 500 }
    );
  }
}
