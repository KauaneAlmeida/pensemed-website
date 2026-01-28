// Simula a função de verificação de produto oculto
const PRODUTOS_OCULTOS_POR_TABELA = {
  'caixa de apoio lombar': [
    'afastador abdominal all path',
    'pinça kerrinson reta p/cima 23cm 2mm',
    'pinça love p/cima 20cm ponta 4x10',
  ],
  'caixa de apoio alif': [
    'cabo dilatadores llif',
    'cinzel smith petersen',
    'dilatador llif',
    'raspador de enxerto llif',
    'supra púbico 135°',
  ],
};

function produtoDeveSerOcultoDaTabela(nomeProduto, nomeTabela) {
  const tabelaLower = nomeTabela.toLowerCase();
  const produtoLower = nomeProduto.toLowerCase().trim();

  const produtosOcultos = PRODUTOS_OCULTOS_POR_TABELA[tabelaLower];
  if (!produtosOcultos) return false;

  return produtosOcultos.some(p => produtoLower.includes(p) || p.includes(produtoLower));
}

const produtosTeste = [
  'CABO DILATADORES LLIF',
  'CINZEL SMITH PETERSEN LLIF RETO 12MM X 30CM',
  'DILATADOR LLIF 10MM',
  'DILATADOR LLIF 12MM',
  'DILATADOR LLIF 14MM',
  'DILATADOR LLIF 8MM',
  'RASPADOR DE ENXERTO LLIF RETO 45CM x 8MM',
  'SUPRA PÚBICO 135° 210 X 45 X 130MM',
  'AFASTADOR HOHMANN MODELO SPINE 24CM',
  'PINÇA CLOWARD RETA 30CM 2MM',
];

console.log('=== VERIFICAÇÃO DE PRODUTOS OCULTOS ===\n');

for (const produto of produtosTeste) {
  const oculto = produtoDeveSerOcultoDaTabela(produto, 'caixa de apoio alif');
  console.log(oculto ? '🚫 OCULTO' : '✅ VISIVEL', '|', produto);
}
