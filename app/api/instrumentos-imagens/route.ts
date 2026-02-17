import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getImageTableName, corrigirUrlImagem } from '@/lib/productImagesServer';
import { resolverRedirectTabela } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const tabela = request.nextUrl.searchParams.get('tabela');

  if (!tabela) {
    return NextResponse.json({ imagens: [] }, { status: 400 });
  }

  try {
    const tabelaReal = resolverRedirectTabela(tabela);
    const imageTableName = getImageTableName(tabelaReal);
    const { data, error } = await supabase
      .from(imageTableName)
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error(`[API /instrumentos-imagens] Erro ao buscar de "${imageTableName}":`, error.message);
      return NextResponse.json({ imagens: [] });
    }

    // Corrigir URLs com caminhos incorretos no Storage
    const imagens = (data || []).map((img: Record<string, unknown>) => {
      const result = { ...img };
      if (result.url_imagem) result.url_imagem = corrigirUrlImagem(result.url_imagem as string);
      if (result.url) result.url = corrigirUrlImagem(result.url as string);
      return result;
    });

    return NextResponse.json({ imagens });
  } catch (err) {
    console.error('[API /instrumentos-imagens] Erro inesperado:', err);
    return NextResponse.json({ imagens: [] }, { status: 500 });
  }
}
