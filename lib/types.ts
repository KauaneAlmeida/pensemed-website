/**
 * Tipos do banco de dados Supabase
 */

export interface Produto {
  id: string;
  categoria: string;
  nome: string;
  slug: string;
  descricao_curta: string;
  aplicacao: string;
  descricao_tecnica: string;
  caracteristicas_beneficios: string;
  itens_inclusos?: string | null;
  preco_referencia?: string | null;
  codigo_anvisa?: string | null;
  codigo_produto?: string | null;
  imagem_url: string;
  created_at: string;
}

export type Categoria =
  | "Equipamentos Médicos"
  | "Instrumentação Cirúrgica CME"
  | "OPME";

export interface CategoriaInfo {
  slug: string;
  nome: string;
  descricao: string;
  destaque: string;
}

export const CATEGORIAS_MAP: Record<string, CategoriaInfo> = {
  "equipamentos-medicos": {
    slug: "equipamentos-medicos",
    nome: "Equipamentos Médicos",
    descricao: "Equipamentos médicos hospitalares de última geração para locação, com manutenção e suporte técnico especializado.",
    destaque: "Soluções completas para hospitais, clínicas e home care"
  },
  "instrumentacao-cirurgica-cme": {
    slug: "instrumentacao-cirurgica-cme",
    nome: "Instrumentação Cirúrgica CME",
    descricao: "Instrumentação cirúrgica completa com processamento em CME certificado, garantindo segurança e qualidade.",
    destaque: "Instrumentais esterilizados e prontos para uso cirúrgico"
  },
  "opme": {
    slug: "opme",
    nome: "OPME",
    descricao: "Órteses, Próteses e Materiais Especiais sob demanda, com toda documentação necessária e suporte logístico.",
    destaque: "Materiais especiais e descartáveis para procedimentos cirúrgicos"
  }
};

export const getCategoriaBySlug = (slug: string): CategoriaInfo | null => {
  return CATEGORIAS_MAP[slug] || null;
};

export const getCategoriaNameBySlug = (slug: string): string => {
  const categoria = getCategoriaBySlug(slug);
  return categoria?.nome || "";
};

/**
 * Tipos para Instrumentação Cirúrgica CME
 * Tabela: caixa cervical translucente
 *
 * Estrutura real das colunas no Supabase:
 * - id: int8
 * - nome: text (ex: "Afastador Translucent Longitudinal")
 * - categoria: text (ex: "Caixa Cervical Translucente")
 * - codigo: text (ex: "TRS400")
 * - descricao: text
 * - imagem_url: text (pode ser NULL)
 */

export interface InstrumentoCME {
  id: number;
  nome: string;              // Nome do instrumento (ex: "Afastador Translucent Longitudinal")
  nome_original?: string;    // Nome original no Supabase (antes de RENOMEAR_PRODUTO)
  categoria: string;         // Nome da caixa/categoria (ex: "Caixa Cervical Translucente")
  codigo: string;            // Código do produto (ex: "TRS400")
  descricao?: string | null; // Descrição completa
  imagem_url: string | null; // URL da imagem ou NULL
  created_at?: string;
}

export interface InstrumentosCMEPaginados {
  instrumentos: InstrumentoCME[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

/**
 * Interface para grupo de instrumentos agrupados por nome base
 * Ex: "Lâmina All Path Nº1, Nº2, ... Nº10" agrupados em um único grupo
 */
export interface GrupoInstrumentoCME {
  nomeBase: string;           // Nome sem numeração (ex: "Lâmina All Path")
  instrumentos: InstrumentoCME[];  // Lista de instrumentos do grupo
  isAgrupado: boolean;        // true se tem mais de 1 item
  primeiroNumero?: number;    // Menor número (ex: 1)
  ultimoNumero?: number;      // Maior número (ex: 10)
}

/**
 * Extrai informações do nome de um instrumento para agrupamento
 * Suporta apenas padrões claros de numeração:
 * 1. "Lâmina All Path Nº1" → base: "Lâmina All Path", variacao: "Nº1"
 * 2. "ASS185 - Afastador MIS Starlet System 18mm x 50mm" → base: "Afastador MIS Starlet System 18mm", variacao: "50mm"
 * 3. "Cureta Baioneta Reta MIS Starlet System N°0000" → base: "Cureta Baioneta Reta MIS Starlet System", variacao: "N°0000"
 *
 * NÃO agrupa padrões ambíguos como "22cm", "3mm", "Fig 3,6mm" etc.
 */
function extrairInfoAgrupamento(nome: string): { nomeBase: string; variacao: string | null; numero: number | null } {
  // Padrão 1: Código no início (ASS185 - Nome 18mm x 50mm)
  const regexCodigoInicio = /^[A-Z]{2,4}\d+\s*-\s*/i;
  let nomeSemCodigo = nome.replace(regexCodigoInicio, '').trim();

  // Padrão 2: Dimensão no final com "x" (18mm x 50mm, 18mm x 60mm, etc.)
  // Este é um padrão claro de variação de tamanho
  const regexDimensao = /\s+x\s+(\d+)(mm|cm)\s*$/i;
  const matchDimensao = nomeSemCodigo.match(regexDimensao);
  if (matchDimensao) {
    const nomeBase = nomeSemCodigo.replace(regexDimensao, '').trim();
    const numero = parseInt(matchDimensao[1]);
    return { nomeBase, variacao: `${numero}${matchDimensao[2]}`, numero };
  }

  // Padrão 3: Numeração explícita com prefixo (Nº1, N°0000, #1)
  // Este é o padrão mais claro de numeração sequencial
  const regexNumeracao = /\s*(Nº|N°|#)\s*(\d+)\s*$/i;
  const matchNumeracao = nomeSemCodigo.match(regexNumeracao);
  if (matchNumeracao) {
    const nomeBase = nomeSemCodigo.replace(regexNumeracao, '').trim();
    const numero = parseInt(matchNumeracao[2]);
    return { nomeBase, variacao: `${matchNumeracao[1]}${matchNumeracao[2]}`, numero };
  }

  // NÃO usar padrões ambíguos como "22cm", "3mm", "Fig 3,6mm"
  // Esses são especificações do produto, não variações

  // Nenhum padrão claro encontrado
  return { nomeBase: nomeSemCodigo, variacao: null, numero: null };
}

/**
 * Agrupa instrumentos por nome base, identificando itens com numeração/dimensão sequencial
 * Ex: "Lâmina All Path Nº1", "Lâmina All Path Nº2" → grupo "Lâmina All Path"
 * Ex: "ASS185 - Afastador MIS 18mm x 50mm", "ASS186 - Afastador MIS 18mm x 60mm" → grupo "Afastador MIS 18mm"
 */
export function agruparInstrumentosPorNome(instrumentos: InstrumentoCME[]): GrupoInstrumentoCME[] {
  const grupos: Map<string, InstrumentoCME[]> = new Map();
  const nomesOriginais: Map<string, string> = new Map();

  // Primeiro, extrair info de todos os instrumentos para identificar padrões
  const instrumentosComInfo = instrumentos.map(item => ({
    ...item,
    ...extrairInfoAgrupamento(item.nome)
  }));

  // Contar quantos itens cada base tem para decidir se agrupa
  const contadorBases: Map<string, number> = new Map();
  instrumentosComInfo.forEach(item => {
    if (item.variacao !== null) {
      const count = contadorBases.get(item.nomeBase) || 0;
      contadorBases.set(item.nomeBase, count + 1);
    }
  });

  // Agrupar instrumentos
  instrumentosComInfo.forEach(item => {
    const baseCount = contadorBases.get(item.nomeBase) || 0;

    // Só agrupa se houver mais de 1 item com a mesma base
    if (item.variacao !== null && baseCount > 1) {
      if (!grupos.has(item.nomeBase)) {
        grupos.set(item.nomeBase, []);
        nomesOriginais.set(item.nomeBase, item.nomeBase);
      }
      grupos.get(item.nomeBase)!.push({ ...item, _numero: item.numero } as any);
    } else {
      // Item individual
      const chaveUnica = `__individual__${item.id}`;
      grupos.set(chaveUnica, [item]);
      nomesOriginais.set(chaveUnica, item.nome);
    }
  });

  // Converter Map para array de GrupoInstrumentoCME
  const resultado: GrupoInstrumentoCME[] = [];

  grupos.forEach((itens, chave) => {
    const isIndividual = chave.startsWith('__individual__');
    const nomeBase = nomesOriginais.get(chave) || chave;

    // Ordenar por número se tiver
    const itensOrdenados = itens.sort((a, b) => {
      const numA = (a as any)._numero || 0;
      const numB = (b as any)._numero || 0;
      return numA - numB;
    });

    // Extrair números para o range
    const numeros = itensOrdenados
      .map(i => (i as any)._numero)
      .filter((n): n is number => n !== undefined && n !== null);

    resultado.push({
      nomeBase,
      instrumentos: itensOrdenados,
      isAgrupado: !isIndividual && itens.length > 1,
      primeiroNumero: numeros.length > 0 ? Math.min(...numeros) : undefined,
      ultimoNumero: numeros.length > 0 ? Math.max(...numeros) : undefined,
    });
  });

  // Ordenar grupos: primeiro agrupados, depois por quantidade (maiores primeiro), depois alfabético
  return resultado.sort((a, b) => {
    if (a.isAgrupado !== b.isAgrupado) {
      return a.isAgrupado ? -1 : 1; // Grupos primeiro
    }
    if (a.isAgrupado && b.isAgrupado) {
      // Entre grupos, ordenar por quantidade (maiores primeiro)
      if (a.instrumentos.length !== b.instrumentos.length) {
        return b.instrumentos.length - a.instrumentos.length;
      }
    }
    return a.nomeBase.localeCompare(b.nomeBase, 'pt-BR');
  });
}

/**
 * Interface para caixas CME (cada tabela do Supabase é uma caixa)
 */
export interface CaixaCME {
  nome_tabela: string;          // Nome da tabela no Supabase (ex: "caixa cervical translucente")
  nome_exibicao: string;        // Nome formatado para exibição (ex: "Caixa Cervical Translucente")
  total_instrumentos: number;   // Quantidade de registros na tabela
  imagem_url: string | null;    // Imagem do primeiro instrumento
  slug: string;                 // Slug para URL (ex: "caixa-cervical-translucente")
}

/**
 * Tipos para Equipamentos Médicos
 */
export interface EquipamentoMedico {
  id: number;
  nome: string;
  categoria: string;
  codigo?: string | null;
  descricao?: string | null;
  imagem_url: string | null;
}

export interface EquipamentosMedicosPaginados {
  equipamentos: EquipamentoMedico[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface CategoriaEquipamento {
  nome_tabela: string;
  nome_exibicao: string;
  total_itens: number;
  imagem_url: string | null;
  slug: string;
}

/**
 * Mapeamento de nomes de exibição personalizados para tabelas
 * Usado quando o nome padrão (convertido do nome da tabela) não é adequado
 */
export const NOMES_EXIBICAO_PERSONALIZADOS: Record<string, string> = {
  'afastador abdominal all path – omni tract': 'Caixa de Instrumentais – Sistema de Afastamento Abdominal All Path',
  'equipamentos_medicos': 'Equipamentos Médicos',
  'caixa de apoio alif': 'Caixa De Apoio ALIF',
  'caixa_razek_interlaminar_transforaminal': 'Caixa Razek Interlaminar e Transforaminal',
  'caixa_endoline_interlaminar': 'Caixa Endoline Interlaminar',
  'caixa_instrucao_biportal_ube': 'Caixa de Instrumentação Biportal UBE',
  'craniotomo_drill_eletrico': 'Craniótomo / Drill Elétrico',
  'caixa intrumentacao cirurgica cranio': 'Caixa de Instrumentação Cirúrgica Crânio',
  'caixa cervical translucente': 'Caixa Cervical Translucente',
  'caixa endoscopia coluna': 'Caixa Endoscopia Coluna',
  'caixa micro tesouras': 'Caixa Micro Tesouras',
  'caixa microdissectores rhoton': 'Caixa Microdissectores Rhoton',
  'instrumental peça de mão stryker formula': 'Instrumental Peça de Mão Stryker Formula',
  'instrumental de descompressão TOM SHIELD': 'Instrumental de Descompressão TOM SHIELD',
  'instrumental cabo de fibra óptica compatível stryker': 'Instrumental Cabo de Fibra Óptica Compatível Stryker',
  'caixa apoio bucomaxilo': 'Caixa Apoio Bucomaxilo',
};

/**
 * Converte nome de tabela para nome de exibição
 * Primeiro verifica se existe um nome personalizado no mapeamento
 * Ex: "caixa cervical translucente" → "Caixa Cervical Translucente"
 */
export function tabelaToNomeExibicao(nomeTabela: string): string {
  // Verificar se existe nome personalizado
  if (NOMES_EXIBICAO_PERSONALIZADOS[nomeTabela]) {
    return NOMES_EXIBICAO_PERSONALIZADOS[nomeTabela];
  }

  // Fallback: converter automaticamente
  return nomeTabela
    .split(/[_\s]+/) // Split por underscores OU espaços
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}

/**
 * Converte nome de tabela para slug URL-safe usando base64url
 * Esta abordagem garante que qualquer caractere especial seja suportado
 * Ex: "caixa cervical translucente" → "Y2FpeGEgY2VydmljYWwgdHJhbnNsdWNlbnRl"
 */
export function tabelaToSlug(nomeTabela: string): string {
  // Usar base64url encoding (URL-safe)
  return Buffer.from(nomeTabela, 'utf-8').toString('base64url');
}

/**
 * Converte slug base64url de volta para nome da tabela
 * IMPORTANTE: Retorna com espaços porque as tabelas no Supabase usam espaços
 */
export function slugToTabela(slug: string): string {
  console.log('[slugToTabela] Slug recebido:', slug);

  try {
    const decoded = Buffer.from(slug, 'base64url').toString('utf-8');
    console.log('[slugToTabela] Decodificado:', decoded);

    // Verificar se a decodificação parece válida (deve conter letras)
    if (decoded && /[a-zA-Z]/.test(decoded)) {
      return decoded;
    }

    // Se não parece válido, tentar fallback
    console.warn('[slugToTabela] Decodificação inválida, tentando fallback');
    throw new Error('Decodificação inválida');
  } catch (error) {
    console.warn('[slugToTabela] Erro na decodificação base64url:', error);

    // Fallback para slugs antigos (compatibilidade)
    const fallback = slug
      .replace(/~_~/g, ' – ')
      .replace(/_/g, '–')
      .replace(/~/g, ' ')
      .replace(/-/g, ' ');

    console.log('[slugToTabela] Fallback resultado:', fallback);
    return fallback;
  }
}

/**
 * DEPRECATED: Usar tabelaToSlug() ao invés
 */
export function categoriaToSlug(categoria: string): string {
  return categoria
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Valida se um código de produto é válido para exibição
 * Códigos válidos são curtos e têm formato típico (letras + números)
 * Códigos Base64 gerados automaticamente são considerados inválidos
 */
export function codigoValido(codigo: string | null | undefined): boolean {
  if (!codigo) return false;

  // Código inválido se muito longo (códigos normais são curtos como "TRS400", "ASL513")
  if (codigo.length > 20) return false;

  // Código inválido se parece ser Base64 (só letras e números, sem padrão de produto)
  const pareceBase64 = /^[A-Za-z0-9_-]{25,}$/.test(codigo);
  if (pareceBase64) return false;

  // Código válido se tem padrão típico de produto (letras seguidas de números ou vice-versa)
  const padraoCodigoProduto = /^[A-Z]{2,5}\d{2,5}$/i;
  const padraoCodigoSimples = /^[A-Z0-9]{3,15}$/i;

  return padraoCodigoProduto.test(codigo) || padraoCodigoSimples.test(codigo);
}

/**
 * Enriquece descrições curtas ou vazias com informações adicionais
 * Torna as páginas de detalhes mais completas e profissionais
 */
export function enriquecerDescricao(
  descricao: string | null | undefined,
  nomeInstrumento: string,
  categoria: string
): string {
  const descricaoBase = descricao?.trim() || '';

  // Se a descrição já é longa o suficiente, retorna como está
  if (descricaoBase.length >= 150) {
    return descricaoBase;
  }

  // Criar descrição enriquecida
  const intro = descricaoBase || `${nomeInstrumento} para uso em procedimentos cirúrgicos especializados.`;

  const detalhesAdicionais = `

Este instrumento faz parte da ${categoria} e é indicado para procedimentos que exigem alta precisão e confiabilidade.

Características:
• Fabricado com materiais de alta qualidade e durabilidade
• Projetado para máxima precisão em procedimentos cirúrgicos
• Compatível com protocolos de esterilização padrão
• Design ergonômico para uso profissional prolongado
• Atende às normas técnicas e regulatórias vigentes

Disponível para locação com suporte técnico especializado. Entre em contato para verificar disponibilidade e condições.`;

  return intro + detalhesAdicionais;
}

/**
 * Enriquece descrições de equipamentos médicos
 * Versão específica para a seção de Equipamentos Médicos
 */
export function enriquecerDescricaoEquipamento(
  descricao: string | null | undefined,
  nomeEquipamento: string,
  categoria: string
): string {
  const descricaoBase = descricao?.trim() || '';

  // Se a descrição já é longa o suficiente, retorna como está
  if (descricaoBase.length >= 150) {
    return descricaoBase;
  }

  // Criar descrição enriquecida
  const intro = descricaoBase || `${nomeEquipamento} - equipamento médico de alta qualidade para uso hospitalar e clínico.`;

  const detalhesAdicionais = `

Este equipamento faz parte da categoria ${categoria} e é ideal para instituições de saúde que buscam tecnologia de ponta.

Características:
• Tecnologia de última geração
• Manutenção preventiva e corretiva incluída
• Calibração e certificação em dia
• Treinamento operacional disponível
• Suporte técnico especializado 24h
• Atende às normas ANVISA e regulamentações vigentes

Disponível para locação com contrato flexível. Entre em contato para verificar disponibilidade e condições especiais.`;

  return intro + detalhesAdicionais;
}

/**
 * ========================================
 * TIPOS PARA OPME (Órteses, Próteses e Materiais Especiais)
 * ========================================
 */

/**
 * Interface para produtos OPME
 * Tabela: produtos_opme
 */
export interface ProdutoOPME {
  id: number;
  nome: string;
  categoria: string;
  fabricante?: string | null;
  registro_anvisa?: string | null;
  descricao?: string | null;
  aplicacao?: string | null;
  especificacoes_tecnicas?: string | null;
  modelos?: string | null;
  caracteristicas?: string | null;
  compatibilidade?: string | null;
  esterilizacao?: string | null;
  validade?: string | null;
  uso_unico?: boolean | null;
  imagem_url?: string | null;
  created_at?: string;
}

/**
 * Interface para listagem paginada de produtos OPME
 */
export interface ProdutosOPMEPaginados {
  produtos: ProdutoOPME[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

/**
 * Categorias disponíveis de produtos OPME
 */
export const CATEGORIAS_OPME = [
  'Pinça Bipolar',
  'Cânula',
  'Kit Cirúrgico',
  'Eletrodo',
  'Agulha',
  'Probe',
  'Cabo',
  'Acessório',
] as const;

export type CategoriaOPME = typeof CATEGORIAS_OPME[number];

/**
 * Enriquece descrições de produtos OPME
 */
export function enriquecerDescricaoOPME(
  descricao: string | null | undefined,
  nomeProduto: string,
  categoria: string
): string {
  const descricaoBase = descricao?.trim() || '';

  // Se a descrição já é longa o suficiente, retorna como está
  if (descricaoBase.length >= 150) {
    return descricaoBase;
  }

  // Criar descrição enriquecida
  const intro = descricaoBase || `${nomeProduto} - material especial para procedimentos cirúrgicos.`;

  const detalhesAdicionais = `

Este produto faz parte da categoria ${categoria} e atende aos mais rigorosos padrões de qualidade.

Características:
• Material de alta qualidade para uso médico
• Atende normas ANVISA e regulamentações vigentes
• Projetado para máxima segurança e eficácia
• Embalagem estéril e pronta para uso

Entre em contato para verificar disponibilidade e condições.`;

  return intro + detalhesAdicionais;
}
