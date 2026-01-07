import { NextRequest, NextResponse } from 'next/server';
import { getProdutosOPME, getCategoriasOPME } from '@/lib/api';

// Dinâmico porque usa searchParams, mas com cache nos headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const porPagina = parseInt(searchParams.get('porPagina') || '24');
    const busca = searchParams.get('busca') || '';
    const categoria = searchParams.get('categoria') || '';
    const apenasCategoriasParam = searchParams.get('apenasCategoria');

    // Se solicitado apenas categorias
    if (apenasCategoriasParam === 'true') {
      const categorias = await getCategoriasOPME();
      return NextResponse.json({ categorias }, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      });
    }

    const resultado = await getProdutosOPME({
      pagina,
      porPagina,
      busca,
      categoria,
    });

    // Buscar categorias disponíveis para filtros
    const categorias = await getCategoriasOPME();

    return NextResponse.json({
      ...resultado,
      categorias,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API /opme] Erro:', error);
    return NextResponse.json(
      {
        produtos: [],
        total: 0,
        pagina: 1,
        porPagina: 24,
        totalPaginas: 0,
        categorias: [],
        error: 'Erro ao buscar produtos OPME'
      },
      { status: 500 }
    );
  }
}
