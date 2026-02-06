import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getImageTableName } from '@/lib/productImagesServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const tabela = request.nextUrl.searchParams.get('tabela');

  if (!tabela) {
    return NextResponse.json({ imagens: [] }, { status: 400 });
  }

  try {
    const imageTableName = getImageTableName(tabela);
    const { data, error } = await supabase
      .from(imageTableName)
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error(`[API /instrumentos-imagens] Erro ao buscar de "${imageTableName}":`, error.message);
      return NextResponse.json({ imagens: [] });
    }

    return NextResponse.json({ imagens: data || [] });
  } catch (err) {
    console.error('[API /instrumentos-imagens] Erro inesperado:', err);
    return NextResponse.json({ imagens: [] }, { status: 500 });
  }
}
