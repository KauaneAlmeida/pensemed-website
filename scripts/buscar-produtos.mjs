import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar variáveis de ambiente
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
          if (!process.env[key]) process.env[key] = value;
        }
      }
    } catch (error) {}
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TABELAS = [
  'caixa cervical translucente',
  'caixa de apoio alif',
  'caixa de apoio cervical',
  'caixa de apoio lombar',
  'caixa endoscopia coluna',
  'caixa baioneta mis',
  'caixa intrumentacao cirurgica cranio',
  'caixa apoio bucomaxilo',
  'kit afastadores tubulares endoscopia',
  'afastador abdominal all path – omni tract'
];

const termos = ['cureta', 'elevador cobb', 'formao smith', 'formão smith', 'kerrinson', 'kerrison', 'bushe'];

async function buscar() {
  console.log('\n========================================');
  console.log('PRODUTOS PARA AGRUPAMENTO');
  console.log('========================================\n');

  const todosProdutos = [];

  for (const tabela of TABELAS) {
    const { data, error } = await supabase.from(tabela).select('nome');
    if (error) continue;

    const encontrados = data.filter(p =>
      termos.some(t => p.nome.toLowerCase().includes(t.toLowerCase()))
    );

    if (encontrados.length > 0) {
      encontrados.forEach(p => {
        todosProdutos.push({ tabela, nome: p.nome });
      });
    }
  }

  // Agrupar por tipo
  const grupos = {
    'CURETA BUSHE': [],
    'ELEVADOR COBB': [],
    'FORMÃO SMITH': [],
    'PINÇA KERRISON': [],
    'OUTROS': []
  };

  todosProdutos.forEach(p => {
    const nome = p.nome.toUpperCase();
    if (nome.includes('CURETA') && nome.includes('BUSHE')) {
      grupos['CURETA BUSHE'].push(p);
    } else if (nome.includes('CURETA')) {
      grupos['OUTROS'].push(p);
    } else if (nome.includes('ELEVADOR') && nome.includes('COBB')) {
      grupos['ELEVADOR COBB'].push(p);
    } else if (nome.includes('FORMAO') || nome.includes('FORMÃO')) {
      grupos['FORMÃO SMITH'].push(p);
    } else if (nome.includes('KERRISON') || nome.includes('KERRINSON')) {
      grupos['PINÇA KERRISON'].push(p);
    } else {
      grupos['OUTROS'].push(p);
    }
  });

  // Exibir resultados organizados
  for (const [grupo, produtos] of Object.entries(grupos)) {
    if (produtos.length > 0) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 ${grupo} (${produtos.length} produtos)`);
      console.log('='.repeat(60));

      // Agrupar por tabela
      const porTabela = {};
      produtos.forEach(p => {
        if (!porTabela[p.tabela]) porTabela[p.tabela] = [];
        porTabela[p.tabela].push(p.nome);
      });

      for (const [tabela, nomes] of Object.entries(porTabela)) {
        console.log(`\n📁 ${tabela}:`);
        nomes.sort().forEach(n => console.log(`   - ${n}`));
      }
    }
  }
}

buscar();
