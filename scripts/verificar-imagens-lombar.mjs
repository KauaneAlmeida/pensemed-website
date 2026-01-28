import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lrasuvrzyzmmjumxrhzv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYXN1dnJ6eXptbWp1bXhyaHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzI2MDAsImV4cCI6MjA3OTc0ODYwMH0.kq2b2O3BYnApT21lxE5_ErAZZLpUhCPJfvjepxb1XrQ'
);

async function verificar() {
  // Listar todas as imagens da tabela
  const { data, error } = await supabase
    .from('caixa_de_apoio_lombar_imagens')
    .select('id, produto_slug, url_imagem')
    .order('produto_slug');

  console.log('=== TODAS AS IMAGENS DA TABELA ===');
  console.log('Total:', data?.length || 0);
  console.log('');

  if (data) {
    // Agrupar por slug
    const porSlug = {};
    data.forEach(img => {
      if (!porSlug[img.produto_slug]) porSlug[img.produto_slug] = [];
      porSlug[img.produto_slug].push(img);
    });

    for (const [slug, imgs] of Object.entries(porSlug)) {
      console.log(slug, '-', imgs.length, 'imagem(ns)');
    }
  }

  if (error) {
    console.log('Erro:', error.message);
  }
}

verificar().catch(console.error);
