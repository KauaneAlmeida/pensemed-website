import { NextRequest, NextResponse } from 'next/server';
import { getTodosProdutosCatalogo } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const pagina = parseInt(searchParams.get('pagina') || '1');
    const porPagina = parseInt(searchParams.get('porPagina') || '24');
    const busca = searchParams.get('busca') || '';
    const categoria = searchParams.get('categoria') || '';
    const caixaSlug = searchParams.get('caixa') || '';
    const ordenacao = (searchParams.get('ordenacao') as 'nome-asc' | 'nome-desc' | 'recentes') || 'nome-asc';

    console.log('[API /catalogo] Parâmetros:', { pagina, porPagina, busca, categoria, caixaSlug, ordenacao });

    const resultado = await getTodosProdutosCatalogo({
      pagina,
      porPagina,
      busca,
      categoria,
      caixaSlug,
      ordenacao,
    });

    console.log('[API /catalogo] Produtos encontrados:', resultado.total);

    return NextResponse.json(resultado);
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
