import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lrasuvrzyzmmjumxrhzv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYXN1dnJ6eXptbWp1bXhyaHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzI2MDAsImV4cCI6MjA3OTc0ODYwMH0.kq2b2O3BYnApT21lxE5_ErAZZLpUhCPJfvjepxb1XrQ'
);

// Simula a lógica de busca por similaridade
const normalizarNome = (nome) => {
  return nome
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[°º]/g, '')
    .trim();
};

const extrairPalavrasChave = (nome) => {
  return normalizarNome(nome)
    .split(/\s+/)
    .filter(p => p.length > 1 && !/^\d+[,.]?\d*$/.test(p) && !['MM', 'CM', 'X', 'N', 'GR', 'GRAU'].includes(p));
};

async function testar() {
  // Busca todas as imagens
  const { data: todasImagens } = await supabase
    .from('caixa_de_apoio_alif_imagens')
    .select('*');

  // Agrupa por produto_nome
  const imagensPorProduto = new Map();
  for (const img of todasImagens || []) {
    const nome = img.produto_nome;
    if (!imagensPorProduto.has(nome)) {
      imagensPorProduto.set(nome, []);
    }
    imagensPorProduto.get(nome).push(img);
  }

  // Busca todos os produtos
  const { data: produtos } = await supabase
    .from('caixa de apoio alif')
    .select('nome')
    .order('nome');

  console.log('=== TESTE DE BUSCA POR SIMILARIDADE - ALIF ===\n');

  let encontrados = 0;
  let naoEncontrados = 0;

  for (const prod of produtos || []) {
    const productName = prod.nome;
    const palavrasProduto = extrairPalavrasChave(productName);
    let melhorMatch = null;

    for (const [nomeImagem, imagens] of imagensPorProduto) {
      const palavrasImagem = extrairPalavrasChave(nomeImagem);

      // Conta quantas palavras-chave do produto estão presentes no nome da imagem
      let matchesProduto = 0;
      for (const palavraProduto of palavrasProduto) {
        const temMatch = palavrasImagem.some(pi =>
          pi === palavraProduto ||
          pi.startsWith(palavraProduto) ||
          palavraProduto.startsWith(pi) ||
          (pi.length > 4 && palavraProduto.length > 4 &&
           (pi.substring(0, 5) === palavraProduto.substring(0, 5)))
        );
        if (temMatch) matchesProduto++;
      }

      // Também conta quantas palavras-chave da imagem estão no produto
      let matchesImagem = 0;
      for (const palavraImagem of palavrasImagem) {
        const temMatch = palavrasProduto.some(pp =>
          pp === palavraImagem ||
          pp.startsWith(palavraImagem) ||
          palavraImagem.startsWith(pp) ||
          (pp.length > 4 && palavraImagem.length > 4 &&
           (pp.substring(0, 5) === palavraImagem.substring(0, 5)))
        );
        if (temMatch) matchesImagem++;
      }

      // Score combinado: média dos dois scores
      const scoreProduto = matchesProduto / palavrasProduto.length;
      const scoreImagem = palavrasImagem.length > 0 ? matchesImagem / palavrasImagem.length : 0;
      const score = (scoreProduto + scoreImagem) / 2;

      // Exige que pelo menos a primeira palavra-chave principal faça match
      const primeirasPalavrasFazMatch = palavrasProduto.length > 0 && palavrasImagem.length > 0 &&
        (palavrasProduto[0] === palavrasImagem[0] ||
         palavrasProduto[0].startsWith(palavrasImagem[0]) ||
         palavrasImagem[0].startsWith(palavrasProduto[0]));

      // Exige que a segunda palavra também faça match (se existir)
      const segundasPalavrasFazMatch = palavrasProduto.length < 2 || palavrasImagem.length < 2 ||
        palavrasProduto.slice(0, 2).some(pp =>
          palavrasImagem.slice(0, 2).some(pi =>
            pp === pi || pp.startsWith(pi) || pi.startsWith(pp)
          )
        );

      if (score >= 0.4 && primeirasPalavrasFazMatch && segundasPalavrasFazMatch && (!melhorMatch || score > melhorMatch.score)) {
        melhorMatch = { nome: nomeImagem, score, count: imagens.length };
      }
    }

    if (melhorMatch) {
      encontrados++;
      console.log(`✅ ${productName.substring(0, 45).padEnd(47)} -> ${melhorMatch.nome} (${melhorMatch.count} imgs)`);
    } else {
      naoEncontrados++;
      console.log(`❌ ${productName}`);
    }
  }

  console.log('\n=== RESUMO ===');
  console.log(`✅ Produtos COM imagem: ${encontrados}`);
  console.log(`❌ Produtos SEM imagem: ${naoEncontrados}`);
}

testar().catch(console.error);
