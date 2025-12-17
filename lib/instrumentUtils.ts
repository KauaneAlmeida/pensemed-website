// Utilitários para agrupamento e validação de instrumentos/equipamentos

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
