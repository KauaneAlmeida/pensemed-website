import { NextResponse } from 'next/server';
import { getInstrumentosDaTabela, getCaixasCME } from '@/lib/api';
import { InstrumentoCME } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Extrai o nome base de um instrumento para comparação
 * Usa a mesma lógica da função agruparInstrumentosPorNome
 */
function extrairNomeBase(nome: string): { nomeBase: string; numero: number | null } {
  // Padrão 1: Código no início (ASS185 - Nome 18mm x 50mm)
  const regexCodigoInicio = /^[A-Z]{2,4}\d+\s*-\s*/i;
  let nomeSemCodigo = nome.replace(regexCodigoInicio, '').trim();

  // Padrão 2: Dimensão no final (18mm x 50mm, 18mm x 60mm, etc.)
  const regexDimensao = /\s+x\s+(\d+)mm\s*$/i;
  const matchDimensao = nomeSemCodigo.match(regexDimensao);
  if (matchDimensao) {
    const nomeBase = nomeSemCodigo.replace(regexDimensao, '').trim();
    const numero = parseInt(matchDimensao[1]);
    return { nomeBase, numero };
  }

  // Padrão 3: Numeração com prefixo no final (Nº1, N°0000, #1)
  const regexNumeracao = /\s*(Nº|N°|#)\s*(\d+)\s*$/i;
  const matchNumeracao = nomeSemCodigo.match(regexNumeracao);
  if (matchNumeracao) {
    const nomeBase = nomeSemCodigo.replace(regexNumeracao, '').trim();
    const numero = parseInt(matchNumeracao[2]);
    return { nomeBase, numero };
  }

  // Padrão 4: Número simples no final
  const regexNumeroFinal = /\s+(\d+)\s*$/;
  const matchNumeroFinal = nomeSemCodigo.match(regexNumeroFinal);
  if (matchNumeroFinal) {
    const nomeBase = nomeSemCodigo.replace(regexNumeroFinal, '').trim();
    const numero = parseInt(matchNumeroFinal[1]);
    return { nomeBase, numero };
  }

  return { nomeBase: nomeSemCodigo, numero: null };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tabela = searchParams.get('tabela');
  const grupo = searchParams.get('grupo');

  if (!tabela || !grupo) {
    return NextResponse.json(
      { error: 'Parâmetros tabela e grupo são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    // Buscar caixa para obter nome de exibição
    const caixas = await getCaixasCME();
    const caixa = caixas.find(c => c.nome_tabela === tabela);

    if (!caixa) {
      return NextResponse.json(
        { error: 'Caixa não encontrada' },
        { status: 404 }
      );
    }

    // Buscar todos os instrumentos da caixa
    const resultadoPaginado = await getInstrumentosDaTabela(tabela, 1, 1000);
    const todosInstrumentos = resultadoPaginado.instrumentos;

    // Filtrar apenas os instrumentos do grupo usando a mesma lógica de extração
    const instrumentosDoGrupo = todosInstrumentos.filter((inst: InstrumentoCME) => {
      const { nomeBase } = extrairNomeBase(inst.nome);
      return nomeBase.toLowerCase() === grupo.toLowerCase();
    });

    if (instrumentosDoGrupo.length === 0) {
      return NextResponse.json(
        { error: 'Grupo não encontrado' },
        { status: 404 }
      );
    }

    // Extrair números e ordenar
    const instrumentosComNumero = instrumentosDoGrupo.map((inst: InstrumentoCME) => {
      const { numero } = extrairNomeBase(inst.nome);
      return { ...inst, _numero: numero };
    });

    const instrumentosOrdenados = instrumentosComNumero.sort((a, b) => {
      const numA = a._numero || 0;
      const numB = b._numero || 0;
      return numA - numB;
    });

    // Pegar range de números
    const numeros = instrumentosOrdenados
      .map(i => i._numero)
      .filter((n): n is number => n !== null && n > 0);

    const primeiroNumero = numeros.length > 0 ? Math.min(...numeros) : null;
    const ultimoNumero = numeros.length > 0 ? Math.max(...numeros) : null;

    return NextResponse.json({
      nomeBase: grupo,
      caixaNome: caixa.nome_exibicao,
      instrumentos: instrumentosOrdenados,
      primeiroNumero,
      ultimoNumero,
    });
  } catch (error) {
    console.error('Erro ao buscar conjunto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
