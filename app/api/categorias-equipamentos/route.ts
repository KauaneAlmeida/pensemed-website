import { NextResponse } from 'next/server';
import { getCategoriasEquipamentosCached, isEquipamentoProdutoUnico, isEquipamentoExpandido } from '@/lib/api';

// ISR: revalidar a cada 10 minutos
export const revalidate = 600;

export async function GET() {
  try {
    const categorias = await getCategoriasEquipamentosCached();

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
