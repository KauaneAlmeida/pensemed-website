import { NextRequest, NextResponse } from 'next/server';
import { getProdutoOPMEById } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { getProductImagesServer } from '@/lib/productImagesServer';

// Forçar renderização dinâmica para sempre buscar dados frescos
export const dynamic = 'force-dynamic';

// Mapeamento de IDs altos para tabelas OPME extras
const OPME_EXTRAS_MAP: Record<number, string> = {
  0: 'kit_cirurgico_easycore_hip',
};

function resolverTabelaExtra(id: number): { tabela: string; idOriginal: number } | null {
  if (id < 90000) return null;
  const tabelaIndex = Math.floor((id - 90000) / 100);
  const idOriginal = id - 90000 - tabelaIndex * 100;
  const tabela = OPME_EXTRAS_MAP[tabelaIndex];
  if (!tabela) return null;
  return { tabela, idOriginal };
}

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

    // Verificar se é produto de tabela OPME extra
    const extra = resolverTabelaExtra(id);
    if (extra) {
      const { data, error } = await supabase
        .from(extra.tabela)
        .select('*')
        .eq('id', extra.idOriginal)
        .limit(1);

      if (error || !data || data.length === 0) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }

      const item = data[0];
      const produto = {
        id,
        nome: item.nome,
        categoria: item.categoria || 'OPME',
        descricao: item.descricao || null,
        imagem_url: item.imagem_url || null,
        _tabelaOrigem: extra.tabela,
      };

      // Pré-carregar imagens
      let preloadedImages: any[] = [];
      const { data: imgData } = await getProductImagesServer(extra.idOriginal, extra.tabela, item.nome);
      if (imgData && imgData.length > 0) {
        preloadedImages = imgData;
      }

      return NextResponse.json({ ...produto, preloadedImages });
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
