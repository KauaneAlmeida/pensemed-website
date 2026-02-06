import { NextRequest, NextResponse } from 'next/server';
import { getProdutoOPMEById } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';

// Forçar renderização dinâmica para sempre buscar dados frescos
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const produto = await getProdutoOPMEById(id);

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Pré-carregar imagens do produto no servidor
    let preloadedImages: any[] = [];
    try {
      const { data: imagens } = await supabase
        .from('produtos_opme_imagens')
        .select('id, produto_id, url, ordem')
        .eq('produto_id', id)
        .order('ordem', { ascending: true });

      if (imagens && imagens.length > 0) {
        preloadedImages = imagens;
      }
    } catch (err) {
      console.error('[API /opme/[id]] Erro ao pré-carregar imagens:', err);
    }

    return NextResponse.json({ ...produto, preloadedImages });
  } catch (error) {
    console.error('[API /opme/[id]] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}
