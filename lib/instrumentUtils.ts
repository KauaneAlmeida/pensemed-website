// Utilitários para agrupamento e validação de instrumentos/equipamentos

/**
 * Lista de IDs de produtos que devem ser ocultados da listagem
 * Usado para esconder cards de "conjuntos" que são apenas títulos/agrupadores
 */
const PRODUTOS_OCULTOS: (string | number)[] = [
  15001, // Instrumental de Descompressão TOM SHIELD - oculto DENTRO da página (mas imagem aparece no card principal)
];

/**
 * Lista de IDs de produtos OPME que devem ser ocultados
 * Usado para esconder produtos que não têm imagem ou devem ser removidos do catálogo
 */
const PRODUTOS_OPME_OCULTOS: number[] = [
  28, // Agulha/Canula para Biopsia Medula Ossea Tipo Jamshidi
  33, // Marrow-Pack - Kit Aspiracao Celulas Mesenquimais
];

/**
 * Produtos ocultos por tabela específica
 * Chave: nome da tabela (lowercase)
 * Valor: array de nomes de produtos a ocultar (lowercase para comparação)
 */
const PRODUTOS_OCULTOS_POR_TABELA: Record<string, string[]> = {
  'caixa de apoio lombar': [
    // Sem imagem
    'afastador abdominal all path',
    'pinça goiva luer-stiller biarticulada curva 24cm',
    'pinça goivabeyer articulada curva 18cm4,0mm',
    // Ocultos por outros motivos
    'pinça kerrinson reta p/cima 23cm 2mm',
    'pinça love p/cima 20cm ponta 4x10',
  ],
  'caixa de apoio alif': [
    // Sem imagem
    'afastador langenbeck 210mm 25 x 110mm',
    'afastador langenbeck 210mm 25 x 130mm',
    'afastador langenbeck 210mm 25 x 180mm',
    'descolador baioneta p/ cima 32cm x 4mm',
    // Ocultos por outros motivos
    'cabo dilatadores llif',
    'cinzel smith petersen',
    'dilatador llif',
    'raspador de enxerto llif',
    'supra púbico 135°',
  ],
  'caixa baioneta mis': [
    // Sem imagem - Afastadores MIS
    'ass186 - afastador mis starlet system 18mm x 60mm',
    'ass187 - afastador mis starlet system 18mm x 70mm',
    'ass188 - afastador mis starlet system 18mm x 80mm',
    'ass189 - afastador mis starlet system 18mm x 90mm',
    'ass190 - afastador mis starlet system 18mm x 100mm',
    'ass225 - afastador mis starlet system 22mm x 50mm',
    'ass226 - afastador mis starlet system 22mm x 60mm',
    'ass227 - afastador mis starlet system 22mm x 70mm',
    'ass228 - afastador mis starlet system 22mm x 80mm',
    'ass229 - afastador mis starlet system 22mm x 90mm',
    'ass230 - afastador mis starlet system 22mm x 100mm',
    'ass265 - afastador mis starlet system 26mm x 50mm',
    'ass266 - afastador mis starlet system 26mm x 60mm',
    'ass267 - afastador mis starlet system 26mm x 70mm',
    'ass268 - afastador mis starlet system 26mm x 80mm',
    'ass269 - afastador mis starlet system 26mm x 90mm',
    'ass270 - afastador mis starlet system 26mm x 100mm',
    // Sem imagem - Fixação
    'ass281 - base fixação em mesa cirúrgica',
    'ass282 - haste primária p/ fixação em mesa',
    'ass283 - haste secundária p/ fixação em mesa',
    'ass284 - conexão primária p/ fixação',
    'ass285 - conexão secundária p/ fixação',
    'ass286 - braço flexível p/ fixação',
    'ass287 - braço articulado p/ fixação',
    // Sem imagem - Curetas
    'ass300 - cureta baioneta reta mis starlet system n°0000',
    'ass301 - cureta baioneta reta mis starlet system n°000',
    'ass302 - cureta baioneta reta mis starlet system n°00',
    'ass303 - cureta baioneta reta mis starlet system n°0',
    'ass306 - cureta baioneta angulada mis starlet system n°0000',
    'ass307 - cureta baioneta angulada mis starlet system n°000',
    'ass308 - cureta baioneta angulada mis starlet system n°00',
    'ass309 - cureta baioneta angulada mis starlet system n°0',
  ],
  'caixa cervical translucente': [
    // Sem imagem - todos exceto 2
    'afastador transversal direito',
    'afastador transversal esquerdo',
    'afastador vertebral direito',
    'afastador vertebral esquerdo',
    'afastador vertebral duplo acionamento',
    'medidor de profundidade',
    'cabo langembeck para lâminas translucent',
    'impactador translucent',
    'guia drill translucent',
    'drill manual translucent',
    'drill automático translucent',
    'chave aplicadora para parafuso translucent',
    'parafuso 12mm translucent',
    'parafuso 14mm translucent',
    'parafuso 16mm translucent',
    'cureta translucent reta nº0000',
    'cureta translucent reta nº000',
    'cureta translucent reta nº00',
    'cureta translucent angulada nº0000',
    'cureta translucent angulada nº000',
    'cureta translucent angulada nº00',
    'lâmina lisa 35x23mm',
    'lâmina lisa 40x23mm',
    'lâmina lisa 45x23mm',
    'lâmina lisa 50x23mm',
    'lâmina lisa 55x23mm',
    'lâmina lisa 60x23mm',
    'lâmina lisa 65x23mm',
    'lâmina lisa 35x16mm',
    'lâmina lisa 40x16mm',
    'lâmina lisa 45x16mm',
    'lâmina lisa 50x16mm',
    'lâmina lisa 55x16mm',
    'lâmina lisa 60x16mm',
    'lâmina lisa 65x16mm',
    'lâmina c/ dente peq 35x23mm',
    'lâmina c/ dente peq 40x23mm',
    'lâmina c/ dente peq 45x23mm',
    'lâmina c/ dente peq 50x23mm',
    'lâmina c/ dente peq 55x23mm',
    'lâmina c/ dente peq 60x23mm',
    'lâmina c/ dente peq 65x23mm',
    'lâmina c/ dente peq 35x16mm',
    'lâmina c/ dente peq 40x16mm',
    'lâmina c/ dente peq 45x16mm',
    'lâmina c/ dente peq 50x16mm',
    'lâmina c/ dente peq 55x16mm',
    'lâmina c/ dente peq 60x16mm',
    'lâmina c/ dente peq 65x16mm',
    'lâmina c/ dente longo 35x23mm',
    'lâmina c/ dente longo 40x23mm',
    'lâmina c/ dente longo 45x23mm',
    'lâmina c/ dente longo 50x23mm',
    'lâmina c/ dente longo 55x23mm',
    'lâmina c/ dente longo 60x23mm',
    'lâmina c/ dente longo 65x23mm',
  ],
  'caixa endoscopia coluna': [
    // Sem imagem - quase todos
    'pinça de preensão fina',
    'pinça de preensão longa',
    'pinça de dissecção longa',
    'pinça de dissecção fina',
    'pinça kerrison 1mm (90°)',
    'pinça kerrison 2mm (90°)',
    'pinça kerrison 3mm (90°)',
    'pinça kerrison 1mm (130°)',
    'pinça kerrison 2mm (130°)',
    'pinça kerrison 3mm (130°)',
    'tesoura endoscópica reta',
    'tesoura endoscópica curva',
    'probe esférico',
    'probe curvo',
    'dissector curvo',
    'dissector fino',
    'cureta reta',
    'cureta curva',
    'cureta angulada',
    'cânula de acesso 2.8 mm',
    'cânula de acesso 4.0 mm',
    'cânula de trabalho',
    'dilatador cônico 2.8 mm',
    'dilatador cônico 4.0 mm',
    'endoscópio para endoscopia transforaminal',
    'endoscópio para endoscopia interlaminar',
    'endoscópio para estenose',
    'endoscópio para ube',
    'conjunto de instrumentos ube',
  ],
  'caixa apoio bucomaxilo': [
    // Sem imagem
    'pinça walshan reta 23cm',
    'pinça dissecção reta adson lisa 12cm',
  ],
};

/**
 * Redirecionamento de produtos para suas tabelas/caixas de origem
 * Usado quando um produto aparece em uma tabela mas deve linkar para outra
 * Chave: substring do nome do produto (lowercase)
 * Valor: { tabela: nome da tabela de destino, slug: slug para URL }
 */
const PRODUTO_REDIRECT: Record<string, { tabela: string; slug: string }> = {
  'afastador abdominal all path': {
    tabela: 'afastador abdominal all path – omni tract',
    slug: 'YWZhc3RhZG9yIGFiZG9taW5hbCBhbGwgcGF0aCDigJMgb21uaSB0cmFjdA', // base64url de 'afastador abdominal all path – omni tract'
  },
};

/**
 * Verifica se um produto deve ser redirecionado para outra tabela/caixa
 * Retorna o novo slug se houver redirect, ou null se não houver
 */
export function getProdutoRedirect(nomeProduto: string): { tabela: string; slug: string } | null {
  const produtoLower = nomeProduto.toLowerCase().trim();

  for (const [pattern, redirect] of Object.entries(PRODUTO_REDIRECT)) {
    if (produtoLower.includes(pattern)) {
      return redirect;
    }
  }

  return null;
}

/**
 * Verifica se um produto deve ser ocultado da listagem
 */
export function produtoDeveSerOculto(id: string | number): boolean {
  const idNumerico = typeof id === 'string' ? parseInt(id, 10) : id;
  return PRODUTOS_OCULTOS.includes(idNumerico) || PRODUTOS_OCULTOS.includes(id);
}

/**
 * Verifica se um produto deve ser ocultado de uma tabela específica
 */
export function produtoDeveSerOcultoDaTabela(nomeProduto: string, nomeTabela: string): boolean {
  const tabelaLower = nomeTabela.toLowerCase();
  const produtoLower = nomeProduto.toLowerCase().trim();

  const produtosOcultos = PRODUTOS_OCULTOS_POR_TABELA[tabelaLower];
  if (!produtosOcultos) return false;

  return produtosOcultos.some(p => produtoLower.includes(p) || p.includes(produtoLower));
}

/**
 * Verifica se um produto OPME deve ser ocultado (por ID)
 */
export function produtoOPMEDeveSerOculto(id: number): boolean {
  return PRODUTOS_OPME_OCULTOS.includes(id);
}

export interface InstrumentoBase {
  id: string | number;
  nome: string;
  codigo?: string;
  descricao?: string;
  imagem?: string;
  [key: string]: unknown;
}

export interface InstrumentoAgrupado {
  id: string | number;
  nomeBase: string;
  nome: string;
  codigo?: string;
  descricao?: string;
  imagem?: string;
  variacoes: InstrumentoBase[];
  temVariacoes: boolean;
  tipoVariacao?: 'numero' | 'medida';
}

// Padrões para detectar variações
const PADRAO_NUMERO = /\s*(Nº?\s*\d+|N[°º]?\s*\d+|#\d+|\s+\d+)$/i;
const PADRAO_MEDIDA = /\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m|"|'|pol|polegadas?)$/i;

/**
 * Extrai o nome base removendo variações numéricas ou de medida
 */
function extrairNomeBase(nome: string): { nomeBase: string; variacao: string | null; tipo: 'numero' | 'medida' | null } {
  // Tenta detectar variação numérica (Nº1, Nº2, etc)
  const matchNumero = nome.match(PADRAO_NUMERO);
  if (matchNumero) {
    return {
      nomeBase: nome.replace(PADRAO_NUMERO, '').trim(),
      variacao: matchNumero[1].replace(/^Nº?\s*/i, 'Nº').replace(/^N[°º]?\s*/i, 'Nº'),
      tipo: 'numero'
    };
  }

  // Tenta detectar variação de medida (25mm, 30mm, etc)
  const matchMedida = nome.match(PADRAO_MEDIDA);
  if (matchMedida) {
    return {
      nomeBase: nome.replace(PADRAO_MEDIDA, '').trim(),
      variacao: matchMedida[0].trim(),
      tipo: 'medida'
    };
  }

  return { nomeBase: nome, variacao: null, tipo: null };
}

/**
 * Valida se um código é válido (não é Base64, muito longo ou suspeito)
 */
export function codigoValido(codigo: string | undefined | null): boolean {
  if (!codigo) return true; // Sem código é OK

  const codigoLimpo = codigo.trim();

  // Código muito longo (provavelmente Base64 ou hash)
  if (codigoLimpo.length > 20) return false;

  // Parece Base64 (muitas letras maiúsculas/minúsculas misturadas + números)
  const padraoBase64 = /^[A-Za-z0-9+/]{15,}={0,2}$/;
  if (padraoBase64.test(codigoLimpo)) return false;

  // Contém apenas caracteres estranhos
  const caracteresEstranhos = /^[^a-zA-Z0-9\s\-_.]+$/;
  if (caracteresEstranhos.test(codigoLimpo)) return false;

  // Muitos números consecutivos (pode ser ID interno)
  const muitosNumeros = /\d{10,}/;
  if (muitosNumeros.test(codigoLimpo)) return false;

  // Hash ou UUID
  const padraoHash = /^[a-f0-9]{32,}$/i;
  const padraoUuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (padraoHash.test(codigoLimpo) || padraoUuid.test(codigoLimpo)) return false;

  return true;
}

/**
 * Formata a variação para exibição
 */
export function formatarVariacao(variacao: string, tipo: 'numero' | 'medida' | null): string {
  if (!variacao) return '';

  if (tipo === 'medida') {
    // Remove espaços extras e adiciona "x" se necessário
    const limpo = variacao.trim();
    if (!limpo.startsWith('x') && !limpo.startsWith('X')) {
      return `x${limpo}`;
    }
    return limpo;
  }

  // Para números, mantém como está
  return variacao;
}

/**
 * Agrupa instrumentos/equipamentos por nome base
 * Itens com variações (Nº1, Nº2 ou 25mm, 30mm) são agrupados
 */
export function agruparInstrumentos<T extends InstrumentoBase>(itens: T[]): InstrumentoAgrupado[] {
  // NOTA: Não filtramos itens aqui - todos os itens devem ser exibidos
  // A função codigoValido é usada apenas para decidir se exibe o código na UI
  const itensFiltrados = itens;

  // Mapa para agrupar por nome base
  const grupos = new Map<string, {
    nomeBase: string;
    variacoes: (T & { variacaoTexto?: string; tipoVariacao?: 'numero' | 'medida' | null })[];
    tipoVariacao: 'numero' | 'medida' | null;
  }>();

  for (const item of itensFiltrados) {
    const { nomeBase, variacao, tipo } = extrairNomeBase(item.nome);
    const chave = nomeBase.toLowerCase().trim();

    if (!grupos.has(chave)) {
      grupos.set(chave, {
        nomeBase,
        variacoes: [],
        tipoVariacao: tipo
      });
    }

    const grupo = grupos.get(chave)!;
    grupo.variacoes.push({
      ...item,
      variacaoTexto: variacao ? formatarVariacao(variacao, tipo) : undefined,
      tipoVariacao: tipo
    });
  }

  // Converte mapa para array de itens agrupados
  const resultado: InstrumentoAgrupado[] = [];

  for (const [, grupo] of grupos) {
    const temVariacoes = grupo.variacoes.length > 1;
    const primeiroItem = grupo.variacoes[0];

    resultado.push({
      id: primeiroItem.id,
      nomeBase: grupo.nomeBase,
      nome: temVariacoes ? grupo.nomeBase : primeiroItem.nome,
      codigo: primeiroItem.codigo,
      descricao: primeiroItem.descricao,
      imagem: primeiroItem.imagem,
      variacoes: grupo.variacoes,
      temVariacoes,
      tipoVariacao: grupo.tipoVariacao || undefined
    });
  }

  // Ordena por nome
  resultado.sort((a, b) => a.nomeBase.localeCompare(b.nomeBase, 'pt-BR'));

  return resultado;
}

/**
 * Retorna o texto do badge para variações
 */
export function getBadgeVariacoes(count: number): string {
  if (count <= 1) return '';
  return `${count} variações`;
}

/**
 * Configuração de agrupamentos especiais por tabela
 * Define padrões de agrupamento mais complexos que o padrão de variações simples
 */
interface AgrupamentoEspecial {
  // Regex para identificar produtos que pertencem a este grupo
  padrao: RegExp;
  // Função para extrair o identificador do grupo (ex: "18mm" em "Afastador MIS 18mm x 50mm")
  extrairGrupo: (nome: string) => string | null;
  // Função para extrair a variação (ex: "x50mm" em "Afastador MIS 18mm x 50mm")
  extrairVariacao: (nome: string) => string | null;
  // Nome base do grupo (sem a parte variável)
  nomeBase: string;
}

const AGRUPAMENTOS_POR_TABELA: Record<string, AgrupamentoEspecial[]> = {
  'caixa baioneta mis': [
    {
      // Afastador MIS Starlet System 18mm x 50mm -> agrupa por diâmetro (18mm, 22mm, 26mm)
      padrao: /afastador\s+mis\s+starlet\s+system\s+(\d+mm)\s*x\s*(\d+mm)/i,
      extrairGrupo: (nome: string) => {
        const match = nome.match(/afastador\s+mis\s+starlet\s+system\s+(\d+mm)/i);
        return match ? match[1] : null;
      },
      extrairVariacao: (nome: string) => {
        const match = nome.match(/afastador\s+mis\s+starlet\s+system\s+\d+mm\s*x\s*(\d+mm)/i);
        return match ? `x${match[1]}` : null;
      },
      nomeBase: 'Afastador MIS Starlet System',
    },
    {
      // Cureta Baioneta Reta MIS Starlet System N°0000 -> agrupa por tipo (Reta/Angulada)
      padrao: /cureta\s+baioneta\s+(reta|angulada)\s+mis\s+starlet\s+system/i,
      extrairGrupo: (nome: string) => {
        const match = nome.match(/cureta\s+baioneta\s+(reta|angulada)/i);
        return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() : null;
      },
      extrairVariacao: (nome: string) => {
        const match = nome.match(/n[°º]?\s*(\d+)/i);
        return match ? `N°${match[1]}` : null;
      },
      nomeBase: 'Cureta Baioneta',
    },
  ],
  'caixa de apoio lombar': [
    {
      // CURETA BUSHE 26,5 CM ANG FIG 00 -> agrupa todas as Curetas Bushe
      padrao: /cureta\s+bushe/i,
      extrairGrupo: () => '26,5cm',
      extrairVariacao: (nome: string) => {
        // Extrair tipo de ponta e figura
        const angMatch = nome.match(/(ang(?:ulada)?|reta|p\/\s*tras)/i);
        const figMatch = nome.match(/fig\s*(\d+)/i);
        const mmMatch = nome.match(/(\d+)\s*mm/i);

        let variacao = '';
        if (angMatch) {
          const tipo = angMatch[1].toLowerCase();
          if (tipo.includes('ang')) variacao = 'Angular';
          else if (tipo.includes('reta')) variacao = 'Reta';
          else if (tipo.includes('tras')) variacao = 'Reta P/Trás';
        }
        if (figMatch) variacao += ` FIG ${figMatch[1]}`;
        if (mmMatch && !figMatch) variacao += ` ${mmMatch[1]}mm`;

        return variacao.trim() || null;
      },
      nomeBase: 'Cureta Bushe 26,5cm',
    },
    {
      // ELEVADOR COBB 25CM 20MM -> agrupa por comprimento
      padrao: /elevador\s+cobb\s+(?!llif)/i,
      extrairGrupo: () => '20mm',
      extrairVariacao: (nome: string) => {
        const match = nome.match(/(\d+)\s*cm/i);
        return match ? `${match[1]}cm` : null;
      },
      nomeBase: 'Elevador Cobb 20mm',
    },
    {
      // FORMÃO SMITH-PETERSON 24CM X 6MM -> agrupa por largura
      padrao: /form[aã]o\s+smith/i,
      extrairGrupo: () => '24cm',
      extrairVariacao: (nome: string) => {
        const match = nome.match(/x?\s*(\d+)\s*mm/i);
        return match ? `${match[1]}mm` : null;
      },
      nomeBase: 'Formão Smith-Peterson 24cm',
    },
    {
      // PINÇA KERRINSON 40° ANGULADA 20CM 3MM -> agrupa pinças 40° anguladas
      padrao: /pin[cç]a\s+kerr?inson\s+40[°º]?\s*ang/i,
      extrairGrupo: () => '40° Angulada',
      extrairVariacao: (nome: string) => {
        const cmMatch = nome.match(/(\d+)\s*cm/i);
        const mmMatch = nome.match(/(\d+)\s*mm/i);
        let variacao = '';
        if (cmMatch) variacao = `${cmMatch[1]}cm`;
        if (mmMatch) variacao += ` ${mmMatch[1]}mm`;
        return variacao.trim() || null;
      },
      nomeBase: 'Pinça Kerrison 40° Angulada',
    },
    {
      // PINÇA KERRINSON BICO P/ CIMA 40GRAU 20CM 1,0MM -> agrupa pinças bico p/ cima 40°
      padrao: /pin[cç]a\s+kerr?inson\s+bico\s+p\/?\s*cima\s+40/i,
      extrairGrupo: () => 'Bico P/Cima 40°',
      extrairVariacao: (nome: string) => {
        const mmMatch = nome.match(/(\d+[,.]?\d*)\s*mm/i);
        return mmMatch ? `${mmMatch[1].replace(',', '.')}mm` : null;
      },
      nomeBase: 'Pinça Kerrison Bico P/Cima 40° 20cm',
    },
    {
      // PINÇA KERRINSON RETA P/ CIMA 20CM 3MM -> agrupa pinças retas p/ cima
      padrao: /pin[cç]a\s+kerr?inson\s+reta\s+p\/?\s*cima/i,
      extrairGrupo: (nome: string) => {
        const cmMatch = nome.match(/(\d+)\s*cm/i);
        return cmMatch ? `${cmMatch[1]}cm` : 'Reta';
      },
      extrairVariacao: (nome: string) => {
        const mmMatch = nome.match(/(\d+[,.]?\d*)\s*mm/i);
        return mmMatch ? `${mmMatch[1].replace(',', '.')}mm` : null;
      },
      nomeBase: 'Pinça Kerrison Reta P/Cima',
    },
    {
      // CURETA SIMON 22CM PONTA RETA Nº 0 -> agrupa curetas Simon
      padrao: /cureta\s+simon\s+22\s*cm/i,
      extrairGrupo: (nome: string) => {
        const pontaMatch = nome.match(/ponta\s+(reta|angulada)/i);
        return pontaMatch ? pontaMatch[1].charAt(0).toUpperCase() + pontaMatch[1].slice(1).toLowerCase() : 'Geral';
      },
      extrairVariacao: (nome: string) => {
        const numMatch = nome.match(/n[°º]?\s*(\d+)/i);
        return numMatch ? `N°${numMatch[1]}` : null;
      },
      nomeBase: 'Cureta Simon 22cm',
    },
  ],
};

/**
 * Aplica agrupamentos especiais para uma tabela específica
 * Retorna os itens já agrupados de acordo com as regras da tabela
 */
export function aplicarAgrupamentosEspeciais<T extends InstrumentoBase>(
  itens: T[],
  nomeTabela: string
): InstrumentoAgrupado[] {
  const tabelaLower = nomeTabela.toLowerCase();
  const agrupamentosEspeciais = AGRUPAMENTOS_POR_TABELA[tabelaLower];

  // Se não há agrupamentos especiais, usar o agrupamento padrão
  if (!agrupamentosEspeciais || agrupamentosEspeciais.length === 0) {
    return agruparInstrumentos(itens);
  }

  // Separar itens que têm agrupamento especial dos que não têm
  const itensEspeciais: Map<string, {
    config: AgrupamentoEspecial;
    grupo: string;
    itens: (T & { variacaoTexto?: string; tipoVariacao?: 'numero' | 'medida' | null })[];
  }> = new Map();

  const itensNormais: T[] = [];

  for (const item of itens) {
    let encontrouAgrupamento = false;

    for (const config of agrupamentosEspeciais) {
      if (config.padrao.test(item.nome)) {
        const grupo = config.extrairGrupo(item.nome);
        const variacao = config.extrairVariacao(item.nome);

        if (grupo) {
          const chave = `${config.nomeBase}|${grupo}`;

          if (!itensEspeciais.has(chave)) {
            itensEspeciais.set(chave, {
              config,
              grupo,
              itens: [],
            });
          }

          itensEspeciais.get(chave)!.itens.push({
            ...item,
            variacaoTexto: variacao || undefined,
            tipoVariacao: 'medida' as const,
          });

          encontrouAgrupamento = true;
          break;
        }
      }
    }

    if (!encontrouAgrupamento) {
      itensNormais.push(item);
    }
  }

  // Converter grupos especiais em InstrumentoAgrupado
  const resultado: InstrumentoAgrupado[] = [];

  for (const [, grupoData] of itensEspeciais) {
    const { config, grupo, itens: itensGrupo } = grupoData;

    // Ordenar variações numericamente
    itensGrupo.sort((a, b) => {
      const numA = parseInt(a.variacaoTexto?.replace(/\D/g, '') || '0', 10);
      const numB = parseInt(b.variacaoTexto?.replace(/\D/g, '') || '0', 10);
      return numA - numB;
    });

    const primeiroItem = itensGrupo[0];
    const nomeCompleto = `${config.nomeBase} ${grupo}`;

    resultado.push({
      id: primeiroItem.id,
      nomeBase: nomeCompleto,
      nome: nomeCompleto,
      codigo: primeiroItem.codigo,
      descricao: primeiroItem.descricao,
      imagem: primeiroItem.imagem,
      variacoes: itensGrupo,
      temVariacoes: itensGrupo.length > 1,
      tipoVariacao: 'medida',
    });
  }

  // Agrupar itens normais com a função padrão
  const itensNormaisAgrupados = agruparInstrumentos(itensNormais);

  // Combinar e ordenar
  const todosAgrupados = [...resultado, ...itensNormaisAgrupados];
  todosAgrupados.sort((a, b) => a.nomeBase.localeCompare(b.nomeBase, 'pt-BR'));

  return todosAgrupados;
}
