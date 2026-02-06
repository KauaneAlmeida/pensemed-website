import { NextRequest, NextResponse } from 'next/server';
import { getProdutosOPME, getCategoriasOPME } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';

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
      return NextResponse.json({ categorias });
    }

    const resultado = await getProdutosOPME({
      pagina,
      porPagina,
      busca,
      categoria,
    });

    // Pré-carregar imagens dos produtos OPME no servidor
    if (resultado.produtos && resultado.produtos.length > 0) {
      const produtoIds = resultado.produtos
        .filter(p => !p.imagem_url)
        .map(p => p.id);

      if (produtoIds.length > 0) {
        try {
          const { data: imagens } = await supabase
            .from('produtos_opme_imagens')
            .select('produto_id, url, ordem')
            .in('produto_id', produtoIds)
            .order('ordem', { ascending: true });

          if (imagens && imagens.length > 0) {
            // Agrupar por produto_id e pegar a primeira imagem
            const imagensPorProduto = new Map<number, string>();
            for (const img of imagens) {
              if (!imagensPorProduto.has(img.produto_id)) {
                imagensPorProduto.set(img.produto_id, img.url);
              }
            }

            // Atribuir imagens aos produtos (imagem_principal é o campo que o client espera)
            for (const produto of resultado.produtos) {
              if (!(produto as any).imagem_principal && !produto.imagem_url) {
                const url = imagensPorProduto.get(produto.id);
                if (url) {
                  (produto as any).imagem_principal = url;
                }
              }
            }
          }
        } catch (err) {
          console.error('[API /opme] Erro ao pré-carregar imagens:', err);
        }
      }
    }

    // Buscar categorias disponíveis para filtros
    const categorias = await getCategoriasOPME();

    return NextResponse.json({
      ...resultado,
      categorias,
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
