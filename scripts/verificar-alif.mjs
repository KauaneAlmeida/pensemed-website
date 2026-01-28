import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

async function main() {
  console.log('=== Verificando estrutura da tabela de imagens ALIF ===\n');

  // Verificar estrutura da tabela de imagens
  const { data: imagens, error: erroImagens } = await supabase
    .from('caixa_de_apoio_alif_imagens')
    .select('*')
    .limit(5);

  if (erroImagens) {
    console.error('Erro ao buscar imagens:', erroImagens.message);
    return;
  }

  if (imagens && imagens.length > 0) {
    console.log('Colunas da tabela de imagens:', Object.keys(imagens[0]));
    console.log('\nExemplo de registro:');
    console.log(JSON.stringify(imagens[0], null, 2));
  }

  // Listar todos os slugs/nomes únicos
  const { data: todasImagens, error: erroTodas } = await supabase
    .from('caixa_de_apoio_alif_imagens')
    .select('*')
    .order('produto_slug', { ascending: true });

  if (!erroTodas && todasImagens) {
    const slugsUnicos = [...new Set(todasImagens.map(i => i.produto_slug))];
    console.log(`\nTotal de imagens: ${todasImagens.length}`);
    console.log(`Slugs únicos (${slugsUnicos.length}):`);
    slugsUnicos.forEach(slug => {
      const qtd = todasImagens.filter(i => i.produto_slug === slug).length;
      console.log(`  - ${slug} (${qtd} imagens)`);
    });
  }
}

main().catch(console.error);
