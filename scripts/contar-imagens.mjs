/**
 * Script para contar imagens no banco de dados
 * Execute com: node scripts/contar-imagens.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar variáveis de ambiente do .env.local e .env
function loadEnv() {
  const envFiles = ['.env.local', '.env'];

  for (const envFileName of envFiles) {
    try {
      const envPath = resolve(__dirname, '..', envFileName);
      const envFile = readFileSync(envPath, 'utf-8');
      const lines = envFile.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    } catch (error) {
      // Arquivo não existe, continuar
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente SUPABASE não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração das tabelas
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
  'arthrocare quantum 2 rf + pedal',
  'b. braun stimuplex hns12',
  'bomba de artroscopia flosteady 150',
  'gerador de diatermia ellman surgimax 4.0 dual rf 120 ice',
  'gerador de radiofrequencia multigen 4 canais',
  'gerador de rf  para manejo da dor coolief',
  'gerador rf  surgimax plus + pedal',
  'laser lombar delight',
  'stryker 5400-50 core console + pedal',
];

const MAPEAMENTO_TABELAS_IMAGENS = {
  'afastador abdominal all path – omni tract': 'afastador_abdominal_all_path_imagens',
  'caixa cervical translucente': 'caixa_cervical_translucente_imagens',
  'caixa de apoio alif': 'caixa_de_apoio_alif_imagens',
  'caixa de apoio cervical': 'caixa_de_apoio_cervical_imagens',
  'caixa de apoio lombar': 'caixa_de_apoio_lombar_imagens',
  'caixa endoscopia coluna': 'caixa_endoscopia_coluna_imagens',
  'caixa baioneta mis': 'caixa_baioneta_mis_imagens',
  'caixa intrumentacao cirurgica cranio': 'caixa_intrumentacao_cirurgica_cranio_imagens',
  'caixa micro tesouras': 'caixa_micro_tesouras_imagens',
  'caixa microdissectores rhoton': 'caixa_microdissectores_rhoton_imagens',
  'kit afastadores tubulares endoscopia': 'kit_afastadores_tubulares_endoscopia_imagens',
  'caixa apoio bucomaxilo': 'caixa_apoio_bucomaxilo_imagens',
  'instrumental peça de mão stryker formula': 'instrumental_peca_de_mao_stryker_formula_imagens',
  'instrumental de descompressão TOM SHIELD': 'instrumental_de_descompressao_tom_shield_imagens',
  'instrumental cabo de fibra óptica compatível stryker': 'instrumental_cabo_de_fibra_optica_compativel_stryker_imagens',
  'arthrocare quantum 2 rf + pedal': 'arthrocare_quantum_2_rf_pedal_imagens',
  'b. braun stimuplex hns12': 'b_braun_stimuplex_hns12_imagens',
  'bomba de artroscopia flosteady 150': 'bomba_de_artroscopia_flosteady_imagens',
  'gerador de diatermia ellman surgimax 4.0 dual rf 120 ice': 'gerador_de_diatermia_ellman_surgitron_dual_rf_120_ice_imagens',
  'gerador de radiofrequencia multigen 4 canais': 'gerador_de_radiofrequencia_multigen_imagens',
  'gerador de rf  para manejo da dor coolief': 'gerador_de_rf_para_manejo_da_dor_coolief_imagens',
  'gerador rf  surgimax plus + pedal': 'gerador_rf_surgimax_plus_pedal_imagens',
  'laser lombar delight': 'laser_para_hernia_de_disco_lombar_delight_imagens',
  'stryker 5400-50 core console + pedal': 'stryker_core_console_pedal_imagens',
};

const TABELAS_COM_PRODUTO_NOME = [
  'caixa_de_apoio_alif_imagens',
  'caixa_de_apoio_cervical_imagens',
];

async function contarProdutos(nomeTabela) {
  const { data, error } = await supabase
    .from(nomeTabela)
    .select('*');

  if (error) {
    console.error(`Erro ao contar produtos em ${nomeTabela}:`, error.message);
    return 0;
  }

  return data?.length || 0;
}

async function contarImagens(tabelaImagens) {
  const usaNome = TABELAS_COM_PRODUTO_NOME.includes(tabelaImagens);
  const isEspecial = tabelaImagens === 'caixa_de_apoio_lombar_imagens';

  let campoId = 'produto_id';
  if (usaNome) campoId = 'produto_nome';
  if (isEspecial) campoId = 'nome';

  const { data, error } = await supabase
    .from(tabelaImagens)
    .select('*');

  if (error) {
    console.error(`Erro ao contar imagens em ${tabelaImagens}:`, error.message);
    return { totalImagens: 0, produtosUnicos: new Set() };
  }

  const produtosUnicos = new Set();
  data?.forEach((img) => {
    const id = img[campoId];
    if (id) produtosUnicos.add(id);
  });

  return {
    totalImagens: data?.length || 0,
    produtosUnicos
  };
}

async function analisarTabela(nomeTabela) {
  const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];

  if (!tabelaImagens) {
    console.warn(`Tabela de imagens não mapeada para: ${nomeTabela}`);
    return null;
  }

  const totalProdutos = await contarProdutos(nomeTabela);
  const { totalImagens, produtosUnicos } = await contarImagens(tabelaImagens);

  return {
    tabela: nomeTabela,
    tabelaImagens,
    totalProdutos,
    produtosComImagem: produtosUnicos.size,
    produtosSemImagem: Math.max(0, totalProdutos - produtosUnicos.size),
    totalImagens,
  };
}

async function analisarOPME() {
  const { data: produtosOPME, error: erroProdutos } = await supabase
    .from('produtos_opme')
    .select('id');

  if (erroProdutos) {
    console.error('Erro ao contar produtos OPME:', erroProdutos.message);
    return null;
  }

  const { data: imagensOPME, error: erroImagens } = await supabase
    .from('produtos_opme_imagens')
    .select('produto_id');

  if (erroImagens) {
    console.error('Erro ao contar imagens OPME:', erroImagens.message);
    return null;
  }

  const produtosComImagem = new Set(imagensOPME?.map((img) => img.produto_id) || []);

  return {
    tabela: 'produtos_opme',
    tabelaImagens: 'produtos_opme_imagens',
    totalProdutos: produtosOPME?.length || 0,
    produtosComImagem: produtosComImagem.size,
    produtosSemImagem: (produtosOPME?.length || 0) - produtosComImagem.size,
    totalImagens: imagensOPME?.length || 0,
  };
}

async function main() {
  console.log('\n========================================');
  console.log('   RELATÓRIO DE IMAGENS - PENSEMED');
  console.log('========================================\n');

  const resultados = [];

  // Analisar CME
  console.log('📦 INSTRUMENTAÇÃO CIRÚRGICA CME\n');
  console.log('-'.repeat(110));
  console.log('Tabela'.padEnd(55) + ' | Produtos | Com Img | Sem Img | %');
  console.log('-'.repeat(110));

  for (const tabela of TABELAS_CME) {
    const resultado = await analisarTabela(tabela);
    if (resultado) {
      resultados.push(resultado);
      const percentual = resultado.totalProdutos > 0
        ? ((resultado.produtosComImagem / resultado.totalProdutos) * 100).toFixed(1)
        : '0.0';
      console.log(
        `${tabela.padEnd(55)} | ${String(resultado.totalProdutos).padStart(8)} | ${String(resultado.produtosComImagem).padStart(7)} | ${String(resultado.produtosSemImagem).padStart(7)} | ${percentual}%`
      );
    }
  }

  // Analisar Equipamentos
  console.log('\n🏥 EQUIPAMENTOS MÉDICOS\n');
  console.log('-'.repeat(110));
  console.log('Tabela'.padEnd(55) + ' | Produtos | Com Img | Sem Img | %');
  console.log('-'.repeat(110));

  for (const tabela of TABELAS_EQUIPAMENTOS) {
    const resultado = await analisarTabela(tabela);
    if (resultado) {
      resultados.push(resultado);
      const percentual = resultado.totalProdutos > 0
        ? ((resultado.produtosComImagem / resultado.totalProdutos) * 100).toFixed(1)
        : '0.0';
      console.log(
        `${tabela.padEnd(55)} | ${String(resultado.totalProdutos).padStart(8)} | ${String(resultado.produtosComImagem).padStart(7)} | ${String(resultado.produtosSemImagem).padStart(7)} | ${percentual}%`
      );
    }
  }

  // Analisar OPME
  console.log('\n💊 OPME (Órteses, Próteses e Materiais Especiais)\n');
  console.log('-'.repeat(110));

  const resultadoOPME = await analisarOPME();
  if (resultadoOPME) {
    resultados.push(resultadoOPME);
    const percentual = resultadoOPME.totalProdutos > 0
      ? ((resultadoOPME.produtosComImagem / resultadoOPME.totalProdutos) * 100).toFixed(1)
      : '0.0';
    console.log(
      `${'produtos_opme'.padEnd(55)} | ${String(resultadoOPME.totalProdutos).padStart(8)} | ${String(resultadoOPME.produtosComImagem).padStart(7)} | ${String(resultadoOPME.produtosSemImagem).padStart(7)} | ${percentual}%`
    );
  }

  // Resumo final
  const totalProdutos = resultados.reduce((acc, r) => acc + r.totalProdutos, 0);
  const totalComImagem = resultados.reduce((acc, r) => acc + r.produtosComImagem, 0);
  const totalSemImagem = resultados.reduce((acc, r) => acc + r.produtosSemImagem, 0);
  const totalImagens = resultados.reduce((acc, r) => acc + r.totalImagens, 0);

  console.log('\n========================================');
  console.log('            RESUMO GERAL');
  console.log('========================================\n');
  console.log(`📊 Total de produtos:        ${totalProdutos}`);
  console.log(`✅ Produtos COM imagem:      ${totalComImagem} (${((totalComImagem / totalProdutos) * 100).toFixed(1)}%)`);
  console.log(`❌ Produtos SEM imagem:      ${totalSemImagem} (${((totalSemImagem / totalProdutos) * 100).toFixed(1)}%)`);
  console.log(`🖼️  Total de imagens:         ${totalImagens}`);
  if (totalComImagem > 0) {
    console.log(`📷 Média imagens/produto:    ${(totalImagens / totalComImagem).toFixed(2)}`);
  }
  console.log('\n========================================\n');
}

main().catch(console.error);
