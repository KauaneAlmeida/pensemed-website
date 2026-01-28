import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lrasuvrzyzmmjumxrhzv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYXN1dnJ6eXptbWp1bXhyaHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzI2MDAsImV4cCI6MjA3OTc0ODYwMH0.kq2b2O3BYnApT21lxE5_ErAZZLpUhCPJfvjepxb1XrQ'
);

const caixas = [
  { tabela: 'caixa baioneta mis', imagens: 'caixa_baioneta_mis_imagens', tipo: 'id' },
  { tabela: 'caixa cervical translucente', imagens: 'caixa_cervical_translucente_imagens', tipo: 'id' },
  { tabela: 'caixa endoscopia coluna', imagens: 'caixa_endoscopia_coluna_imagens', tipo: 'id' },
  { tabela: 'caixa intrumentacao cirurgica cranio', imagens: 'caixa_intrumentacao_cirurgica_cranio_imagens', tipo: 'id' },
  { tabela: 'caixa micro tesouras', imagens: 'caixa_micro_tesouras_imagens', tipo: 'id' },
  { tabela: 'caixa microdissectores rhoton', imagens: 'caixa_microdissectores_rhoton_imagens', tipo: 'id' },
  { tabela: 'afastador abdominal all path – omni tract', imagens: 'afastador_abdominal_all_path_imagens', tipo: 'id' },
  { tabela: 'caixa apoio bucomaxilo', imagens: 'caixa_apoio_bucomaxilo_imagens', tipo: 'id' },
];

async function verificar() {
  for (const caixa of caixas) {
    try {
      const { data: produtos, error: errProd } = await supabase
        .from(caixa.tabela)
        .select('id, nome');

      if (errProd) {
        console.log('\n=== ' + caixa.tabela.toUpperCase() + ' === (erro produtos: ' + errProd.message + ')');
        continue;
      }

      const { data: imagens, error: errImg } = await supabase
        .from(caixa.imagens)
        .select('produto_id');

      if (errImg) {
        console.log('\n=== ' + caixa.tabela.toUpperCase() + ' === (erro imagens: ' + errImg.message + ')');
        continue;
      }

      const idsComImagem = new Set((imagens || []).map(i => i.produto_id));

      console.log('\n=== ' + caixa.tabela.toUpperCase() + ' - SEM IMAGEM ===');
      const semImagem = [];
      for (const p of produtos || []) {
        if (!idsComImagem.has(p.id)) {
          semImagem.push(p.nome);
          console.log(p.nome);
        }
      }
      console.log('Total: ' + semImagem.length + ' sem imagem de ' + (produtos?.length || 0));
    } catch (e) {
      console.log('\n=== ' + caixa.tabela + ' === (erro: ' + e.message + ')');
    }
  }
}

verificar();
