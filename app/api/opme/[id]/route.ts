import { NextRequest, NextResponse } from 'next/server';
import { getProdutoOPMEById } from '@/lib/api';

// ISR: revalidar a cada 5 minutos
export const revalidate = 300;

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

    return NextResponse.json(produto, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API /opme/[id]] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}
