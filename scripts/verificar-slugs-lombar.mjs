/**
 * Script para verificar os slugs da tabela caixa_de_apoio_lombar_imagens
 * Execute com: node scripts/verificar-slugs-lombar.mjs
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

// Função para gerar slug (mesma do hook)
function gerarSlugProduto(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[,.:;]/g, '')          // Remove pontuação
    .replace(/[\/\\]/g, '-')         // Substitui barras por hífen
    .replace(/[^a-z0-9\s-]/g, '')    // Remove caracteres especiais
    .replace(/\s+/g, '-')            // Espaços para hífens
    .replace(/-+/g, '-')             // Remove hífens duplicados
    .replace(/^-|-$/g, '');          // Remove hífens no início/fim
}

// Função para extrair palavras-chave de um slug
function extrairPalavrasChave(slug) {
  return slug
    .split('-')
    .filter(p => p.length > 2 && !/^\d+$/.test(p) && !['cm', 'mm', 'grau', 'fig'].includes(p));
}

// Função para verificar correspondência com prefixo
function verificarCorrespondencia(slugGerado, slugsDisponiveis) {
  // Estratégia 1: match exato
  if (slugsDisponiveis.includes(slugGerado)) {
    return { match: true, tipo: 'exato', slugEncontrado: slugGerado };
  }

  const palavras = extrairPalavrasChave(slugGerado);

  // Estratégia 2: prefixo com 3 palavras
  const prefixo3 = palavras.slice(0, 3).join('-');
  for (const slug of slugsDisponiveis) {
    if (slug.startsWith(prefixo3)) {
      return { match: true, tipo: 'prefixo3', slugEncontrado: slug };
    }
  }

  // Estratégia 3: prefixo com 2 palavras
  const prefixo2 = palavras.slice(0, 2).join('-');
  for (const slug of slugsDisponiveis) {
    if (slug.startsWith(prefixo2)) {
      return { match: true, tipo: 'prefixo2', slugEncontrado: slug };
    }
  }

  return { match: false, tipo: 'nenhum', slugEncontrado: null };
}

async function main() {
  console.log('\n========================================');
  console.log('   VERIFICAÇÃO DE SLUGS - CAIXA LOMBAR');
  console.log('========================================\n');

  // Buscar imagens da tabela
  const { data: imagens, error: erroImagens } = await supabase
    .from('caixa_de_apoio_lombar_imagens')
    .select('*')
    .order('produto_slug', { ascending: true });

  if (erroImagens) {
    console.error('Erro ao buscar imagens:', erroImagens.message);
    return;
  }

  console.log(`Total de imagens na tabela: ${imagens?.length || 0}\n`);

  // Mostrar slugs únicos
  const slugsUnicos = [...new Set(imagens?.map(img => img.produto_slug))];
  console.log(`Slugs únicos (${slugsUnicos.length}):`);
  slugsUnicos.forEach(slug => {
    const qtd = imagens.filter(img => img.produto_slug === slug).length;
    console.log(`  - ${slug} (${qtd} imagens)`);
  });

  // Buscar produtos da tabela principal
  console.log('\n========================================');
  console.log('   PRODUTOS DA CAIXA DE APOIO LOMBAR');
  console.log('========================================\n');

  const { data: produtos, error: erroProdutos } = await supabase
    .from('caixa de apoio lombar')
    .select('nome')
    .order('nome', { ascending: true });

  if (erroProdutos) {
    console.error('Erro ao buscar produtos:', erroProdutos.message);
    return;
  }

  console.log(`Total de produtos: ${produtos?.length || 0}\n`);

  // Comparar slugs gerados com slugs na tabela
  console.log('Comparação de slugs:\n');
  console.log('Nome do Produto'.padEnd(45) + ' | Tipo Match | Slug Encontrado');
  console.log('-'.repeat(100));

  let matchesExato = 0;
  let matchesPrefixo3 = 0;
  let matchesPrefixo2 = 0;
  let noMatches = 0;

  for (const produto of produtos || []) {
    const slugGerado = gerarSlugProduto(produto.nome);
    const resultado = verificarCorrespondencia(slugGerado, slugsUnicos);

    if (resultado.match) {
      if (resultado.tipo === 'exato') matchesExato++;
      else if (resultado.tipo === 'prefixo3') matchesPrefixo3++;
      else if (resultado.tipo === 'prefixo2') matchesPrefixo2++;
      console.log(`✅ ${produto.nome.substring(0, 43).padEnd(45)} | ${resultado.tipo.padEnd(10)} | ${resultado.slugEncontrado}`);
    } else {
      noMatches++;
      console.log(`❌ ${produto.nome.substring(0, 43).padEnd(45)} | ${resultado.tipo.padEnd(10)} | -`);
    }
  }

  const totalMatches = matchesExato + matchesPrefixo3 + matchesPrefixo2;

  console.log('\n========================================');
  console.log('   RESUMO');
  console.log('========================================\n');
  console.log(`✅ Produtos COM imagem correspondente: ${totalMatches}`);
  console.log(`   - Match exato: ${matchesExato}`);
  console.log(`   - Match por prefixo (3 palavras): ${matchesPrefixo3}`);
  console.log(`   - Match por prefixo (2 palavras): ${matchesPrefixo2}`);
  console.log(`❌ Produtos SEM imagem correspondente: ${noMatches}`);
}

main().catch(console.error);
