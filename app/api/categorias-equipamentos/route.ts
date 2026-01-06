import { NextResponse } from 'next/server';
import { getCategoriasEquipamentos } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const categorias = await getCategoriasEquipamentos();
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('[API /categorias-equipamentos] Erro:', error);
    return NextResponse.json([], { status: 500 });
  }
}
