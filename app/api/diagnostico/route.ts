import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Arrays de tabelas conforme definido em lib/api.ts
const TABELAS_CME = [
  'caixa cervical translucente',
  'caixa de apoio alif',
  'caixa de apoio cervical',
  'caixa de apoio lombar',
  'caixa endoscopia coluna',
  'caixa baioneta mis',
  'caixa intrumentacao cirurgica cranio',
  'caixa micro tesouras',
  'caixa microdissectores rhoton',
  'kit afastadores tubulares endoscopia',
  'afastador abdominal all path – omni tract',
  'caixa apoio bucomaxilo',
  'instrumental peça de mão stryker formula',
  'instrumental de descompressão TOM SHIELD',
  'instrumental cabo de fibra óptica compatível stryker',
];

const TABELAS_EQUIPAMENTOS = [
  'stryker 5400-50 core console + pedal',
  'bomba de artroscopia flosteady 150',
  'gerador de radiofrequencia multigen 4 canais',
  'gerador de rf  para manejo da dor coolief',
  'gerador rf  surgimax plus + pedal',
  'gerador de diatermia ellman surgimax 4.0 dual rf 120 ice',
  'b. braun stimuplex hns12',
  'arthrocare quantum 2 rf + pedal',
  'laser lombar delight',
];

interface ResultadoVerificacao {
  tabela: string;
  tipo: 'CME' | 'Equipamentos';
  status: 'OK' | 'ERRO' | 'VAZIA';
  registros: number;
  erro?: string;
  colunas?: string[];
  primeiroRegistro?: any;
}

async function verificarTabela(nomeTabela: string, tipo: 'CME' | 'Equipamentos'): Promise<ResultadoVerificacao> {
  try {
    // Tentar buscar dados da tabela
    const { data, error } = await supabase
      .from(nomeTabela)
      .select('*')
      .limit(1);

    if (error) {
      return {
        tabela: nomeTabela,
        tipo,
        status: 'ERRO',
        registros: 0,
        erro: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        tabela: nomeTabela,
        tipo,
        status: 'VAZIA',
        registros: 0,
      };
    }

    // Obter colunas do primeiro registro
    const colunas = Object.keys(data[0]);

    // Contar total de registros
    const { count } = await supabase
      .from(nomeTabela)
      .select('*', { count: 'exact', head: true });

    return {
      tabela: nomeTabela,
      tipo,
      status: 'OK',
      registros: count || 1,
      colunas,
      primeiroRegistro: data[0],
    };
  } catch (err: any) {
    return {
      tabela: nomeTabela,
      tipo,
      status: 'ERRO',
      registros: 0,
      erro: err.message || 'Erro desconhecido',
    };
  }
}

export async function GET() {
  console.log('[API Diagnostico] Iniciando verificacao de tabelas...');

  const resultados: ResultadoVerificacao[] = [];

  // Verificar tabelas CME
  for (const tabela of TABELAS_CME) {
    const resultado = await verificarTabela(tabela, 'CME');
    resultados.push(resultado);
    console.log(`[CME] "${tabela}": ${resultado.status} (${resultado.registros} registros)`);
    if (resultado.erro) {
      console.log(`  ERRO: ${resultado.erro}`);
    }
  }

  // Verificar tabelas de Equipamentos
  for (const tabela of TABELAS_EQUIPAMENTOS) {
    const resultado = await verificarTabela(tabela, 'Equipamentos');
    resultados.push(resultado);
    console.log(`[Equip] "${tabela}": ${resultado.status} (${resultado.registros} registros)`);
    if (resultado.erro) {
      console.log(`  ERRO: ${resultado.erro}`);
    }
  }

  // Resumo
  const ok = resultados.filter(r => r.status === 'OK');
  const erros = resultados.filter(r => r.status === 'ERRO');
  const vazias = resultados.filter(r => r.status === 'VAZIA');

  const resumo = {
    totalTabelas: resultados.length,
    tabelasOK: ok.length,
    tabelasComErro: erros.length,
    tabelasVazias: vazias.length,
    tabelasComProblema: erros.map(r => ({
      nome: r.tabela,
      tipo: r.tipo,
      erro: r.erro,
    })),
  };

  console.log('\n[API Diagnostico] RESUMO:');
  console.log(`  OK: ${ok.length}`);
  console.log(`  Erro: ${erros.length}`);
  console.log(`  Vazias: ${vazias.length}`);

  if (erros.length > 0) {
    console.log('\n[API Diagnostico] TABELAS COM ERRO:');
    erros.forEach(r => {
      console.log(`  - "${r.tabela}": ${r.erro}`);
    });
  }

  return NextResponse.json({
    sucesso: erros.length === 0,
    resumo,
    resultados,
    sugestoes: [
      'Verifique os nomes exatos das tabelas no Supabase Dashboard',
      'Os nomes de tabelas sao case-sensitive',
      'Cuidado com espacos duplos e caracteres especiais',
      'O caracter "–" (en dash) e diferente de "-" (hifen)',
    ],
  });
}
