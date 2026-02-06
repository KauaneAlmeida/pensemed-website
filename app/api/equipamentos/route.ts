import { NextRequest, NextResponse } from 'next/server';
import { getEquipamentosDaTabela } from '@/lib/api';

// Dinâmico para sempre buscar dados frescos do Supabase
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

    const resultado = await getEquipamentosDaTabela(tabela, pagina, porPagina);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('[API /equipamentos] Erro:', error);
    return NextResponse.json(
      { equipamentos: [], total: 0, totalPaginas: 0 },
      { status: 500 }
    );
  }
}
