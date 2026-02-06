import { NextResponse } from 'next/server';
import { getCategoriasEquipamentos, isEquipamentoProdutoUnico, isEquipamentoExpandido } from '@/lib/api';

// Dinâmico para sempre buscar dados frescos do Supabase
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categorias = await getCategoriasEquipamentos();

    // Adicionar flag de produto único em cada categoria
    // Itens de tabelas expandidas (equipamentos_medicos) também são produto único
    const categoriasComFlag = categorias.map(cat => ({
      ...cat,
      isProdutoUnico: isEquipamentoProdutoUnico(cat.nome_tabela) || isEquipamentoExpandido(cat.nome_tabela),
    }));

    return NextResponse.json(categoriasComFlag, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('[API /categorias-equipamentos] Erro:', error);
    return NextResponse.json([], { status: 500 });
  }
}
