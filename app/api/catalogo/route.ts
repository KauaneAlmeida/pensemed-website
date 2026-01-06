import { NextRequest, NextResponse } from 'next/server';
import { getTodosProdutosCatalogo } from '@/lib/api';

// Dinâmico porque usa searchParams, mas com headers de cache
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const pagina = parseInt(searchParams.get('pagina') || '1');
    const porPagina = parseInt(searchParams.get('porPagina') || '24');
    const busca = searchParams.get('busca') || '';
    const categoria = searchParams.get('categoria') || '';
    const caixaSlug = searchParams.get('caixa') || '';
    const ordenacao = (searchParams.get('ordenacao') as 'nome-asc' | 'nome-desc' | 'recentes') || 'nome-asc';

    const resultado = await getTodosProdutosCatalogo({
      pagina,
      porPagina,
      busca,
      categoria,
      caixaSlug,
      ordenacao,
    });

    return NextResponse.json(resultado, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API /catalogo] Erro:', error);
    return NextResponse.json(
      {
        produtos: [],
        total: 0,
        pagina: 1,
        porPagina: 24,
        totalPaginas: 0,
        filtros: { categorias: [], caixas: [] },
        error: 'Erro ao buscar produtos'
      },
      { status: 500 }
    );
  }
}
