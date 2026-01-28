// Padrões
const PADRAO_NUMERO = /\s*(N[º°]?\s*\d+|#\d+)$/i;
const PADRAO_MEDIDA_COMPOSTA = /\s*(\d+(?:[,.]\d+)?)\s*[xX]\s*(\d+(?:[,.]\d+)?)\s*(mm|cm|m)?$/i;
const PADRAO_PONTA = /\s*PONTA\s+(\d+)\s*[xX×]\s*(\d+)\s*(mmr?|r)?$/i;
const PADRAO_MEDIDA_SIMPLES = /\s*[xX]?\s*(\d+(?:[,.]\d+)?)\s*(mm|cm|mmr|r)$/i;

function extrairVariacaoDoNome(nome) {
  if (!nome) return { nomeBase: '', variacao: null, tipo: null };

  // 1. Tenta detectar variação numérica (Nº1, Nº2, etc)
  const matchNumero = nome.match(PADRAO_NUMERO);
  if (matchNumero) {
    const variacao = matchNumero[1]
      .replace(/^Nº?\s*/i, 'Nº')
      .replace(/^N[°º]?\s*/i, 'Nº')
      .replace(/^#\s*/i, 'Nº');
    return {
      nomeBase: nome.replace(PADRAO_NUMERO, '').trim(),
      variacao,
      tipo: 'numero'
    };
  }

  // 2. Tenta detectar padrão "PONTA NxM" (ex: PONTA 2X10MMR, PONTA 3X10R, PONTA 4X10)
  const matchPonta = nome.match(PADRAO_PONTA);
  if (matchPonta) {
    const dim1 = matchPonta[1];
    const dim2 = matchPonta[2];
    return {
      nomeBase: nome.replace(PADRAO_PONTA, '').trim(),
      variacao: `PONTA ${dim1}x${dim2}`,
      tipo: 'medida'
    };
  }

  // 3. Tenta detectar medidas compostas (35x23mm, 25 X 110MM, etc)
  const matchComposta = nome.match(PADRAO_MEDIDA_COMPOSTA);
  if (matchComposta) {
    const dim1 = matchComposta[1];
    const dim2 = matchComposta[2];
    const unidade = (matchComposta[3] || 'mm').toUpperCase();
    return {
      nomeBase: nome.replace(PADRAO_MEDIDA_COMPOSTA, '').trim(),
      variacao: dim1 + 'x' + dim2 + unidade,
      tipo: 'medida'
    };
  }

  // 4. Tenta detectar medidas simples (18CM, x24CM, X 5MM, 10,0MM)
  const matchSimples = nome.match(PADRAO_MEDIDA_SIMPLES);
  if (matchSimples) {
    const valor = matchSimples[1].replace(',', '.');
    const unidade = matchSimples[2].toUpperCase();
    return {
      nomeBase: nome.replace(PADRAO_MEDIDA_SIMPLES, '').trim(),
      variacao: valor + unidade,
      tipo: 'medida'
    };
  }

  return { nomeBase: nome, variacao: null, tipo: null };
}

// Testar com as pinças
const pincas = [
  'PINÇA LOVE P/CIMA 20CM PONTA 2X10MMR',
  'PINÇA LOVE P/CIMA 20CM PONTA 3X10R',
  'PINÇA LOVE P/CIMA 20CM PONTA 4X10',
];

console.log('=== TESTE EXTRAÇÃO DE VARIAÇÕES ===\n');
pincas.forEach(nome => {
  const result = extrairVariacaoDoNome(nome);
  console.log('Nome:', nome);
  console.log('  nomeBase:', result.nomeBase);
  console.log('  variacao:', result.variacao);
  console.log('  tipo:', result.tipo);
  console.log('');
});
