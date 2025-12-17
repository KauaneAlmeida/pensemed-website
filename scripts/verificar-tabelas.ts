/**
 * Script de diagnóstico para verificar todas as tabelas no Supabase
 * Execute com: npx ts-node scripts/verificar-tabelas.ts
 * Ou: npx tsx scripts/verificar-tabelas.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configurar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
}

async function verificarTabela(nomeTabela: string, tipo: 'CME' | 'Equipamentos'): Promise<ResultadoVerificacao> {
  try {
    // Tentar buscar dados da tabela
    const { data, error } = await supabase
      .from(nomeTabela)
      .select('*')
      .limit(5);

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
    const { count, error: countError } = await supabase
      .from(nomeTabela)
      .select('*', { count: 'exact', head: true });

    return {
      tabela: nomeTabela,
      tipo,
      status: 'OK',
      registros: count || data.length,
      colunas,
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

async function verificarTodasTabelas() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('            DIAGNÓSTICO DE TABELAS - PENSEMED');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Supabase URL: ${supabaseUrl.substring(0, 30)}...\n`);

  const resultados: ResultadoVerificacao[] = [];

  // Verificar tabelas CME
  console.log('\n📦 TABELAS CME (Instrumentação Cirúrgica)');
  console.log('─'.repeat(60));

  for (const tabela of TABELAS_CME) {
    const resultado = await verificarTabela(tabela, 'CME');
    resultados.push(resultado);

    const icon = resultado.status === 'OK' ? '✅' : resultado.status === 'VAZIA' ? '⚠️' : '❌';
    console.log(`${icon} "${tabela}"`);
    console.log(`   Status: ${resultado.status} | Registros: ${resultado.registros}`);
    if (resultado.erro) {
      console.log(`   Erro: ${resultado.erro}`);
    }
    if (resultado.colunas) {
      console.log(`   Colunas: ${resultado.colunas.join(', ')}`);
    }
    console.log('');
  }

  // Verificar tabelas de Equipamentos
  console.log('\n🏥 TABELAS EQUIPAMENTOS MÉDICOS');
  console.log('─'.repeat(60));

  for (const tabela of TABELAS_EQUIPAMENTOS) {
    const resultado = await verificarTabela(tabela, 'Equipamentos');
    resultados.push(resultado);

    const icon = resultado.status === 'OK' ? '✅' : resultado.status === 'VAZIA' ? '⚠️' : '❌';
    console.log(`${icon} "${tabela}"`);
    console.log(`   Status: ${resultado.status} | Registros: ${resultado.registros}`);
    if (resultado.erro) {
      console.log(`   Erro: ${resultado.erro}`);
    }
    if (resultado.colunas) {
      console.log(`   Colunas: ${resultado.colunas.join(', ')}`);
    }
    console.log('');
  }

  // Resumo
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                        RESUMO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const ok = resultados.filter(r => r.status === 'OK');
  const erros = resultados.filter(r => r.status === 'ERRO');
  const vazias = resultados.filter(r => r.status === 'VAZIA');

  console.log(`✅ Tabelas OK: ${ok.length}`);
  console.log(`⚠️  Tabelas vazias: ${vazias.length}`);
  console.log(`❌ Tabelas com erro: ${erros.length}`);

  if (erros.length > 0) {
    console.log('\n🔴 TABELAS COM ERRO (provavelmente nome incorreto):');
    erros.forEach(r => {
      console.log(`   - "${r.tabela}" (${r.tipo})`);
      console.log(`     Erro: ${r.erro}`);
    });
  }

  // Sugestões de nomes alternativos
  console.log('\n💡 POSSÍVEIS CORREÇÕES:');
  console.log('─'.repeat(60));
  console.log('Verifique os nomes exatos das tabelas no Supabase Dashboard.');
  console.log('Os nomes das tabelas no Supabase são case-sensitive e');
  console.log('devem corresponder exatamente ao nome definido.\n');

  console.log('Dicas de correção comum:');
  console.log('  - Espaços duplos: "gerador de rf  para" → "gerador de rf para"');
  console.log('  - Acentos: "instrumental peça" → pode ser "instrumental peca"');
  console.log('  - Caracteres especiais: "–" (en dash) vs "-" (hífen)');
  console.log('  - Maiúsculas: "TOM SHIELD" → pode ser "tom shield"');

  // Tentar buscar todas as tabelas existentes no schema public
  console.log('\n\n🔍 TENTANDO LISTAR TABELAS EXISTENTES NO SUPABASE...');
  console.log('─'.repeat(60));

  try {
    // Esta query pode não funcionar dependendo das permissões RLS
    const { data: tables, error } = await supabase
      .rpc('get_tables_list');

    if (error) {
      console.log('⚠️  Não foi possível listar tabelas automaticamente.');
      console.log('   Verifique manualmente no Supabase Dashboard: Database > Tables');
    } else if (tables) {
      console.log('Tabelas encontradas:');
      tables.forEach((t: any) => console.log(`   - ${t.table_name}`));
    }
  } catch (e) {
    console.log('⚠️  Não foi possível listar tabelas automaticamente.');
    console.log('   Verifique manualmente no Supabase Dashboard: Database > Tables');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    FIM DO DIAGNÓSTICO');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Executar
verificarTodasTabelas().catch(console.error);
