import { supabase } from './supabaseClient';
import { Produto, getCategoriaNameBySlug, InstrumentoCME, InstrumentosCMEPaginados, CaixaCME, tabelaToNomeExibicao, tabelaToSlug, CategoriaEquipamento, EquipamentoMedico, EquipamentosMedicosPaginados } from './types';

/**
 * Verifica se um código é válido para detecção de duplicados
 * Códigos válidos são: códigos alfanuméricos curtos (ex: TRS401, AFA118)
 * Códigos INVÁLIDOS são: IDs numéricos simples (1, 10, 123), base64, hashes
 */
function codigoValidoParaDuplicados(codigo: string | null | undefined): boolean {
  if (!codigo) return false;

  const codigoLimpo = codigo.trim();

  // Muito curto ou muito longo
  if (codigoLimpo.length < 2 || codigoLimpo.length > 20) return false;

  // ID numérico simples (apenas números) - NÃO é código válido para duplicados
  if (/^\d+$/.test(codigoLimpo)) return false;

  // Base64 ou hash (muitos caracteres mistos)
  if (/^[A-Za-z0-9+/]{15,}={0,2}$/.test(codigoLimpo)) return false;

  // Hash ou UUID
  if (/^[a-f0-9]{32,}$/i.test(codigoLimpo)) return false;
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(codigoLimpo)) return false;

  // Código válido: deve ter pelo menos uma letra e pode ter números
  // Exemplos válidos: TRS401, AFA118, ASS185
  return /[A-Za-z]/.test(codigoLimpo);
}

/**
 * Remove itens duplicados de uma lista baseado no nome (normalizado)
 * Um item é considerado duplicado se tiver o mesmo nome (ignorando maiúsculas/minúsculas e acentos)
 * ou o mesmo código válido (códigos alfanuméricos como TRS401, não IDs numéricos)
 */
function removerDuplicados<T extends { nome: string; codigo?: string | null }>(itens: T[]): T[] {
  const nomesVistos = new Set<string>();
  const codigosVistos = new Set<string>();
  let duplicadosRemovidos = 0;

  const itensUnicos = itens.filter(item => {
    // Normalizar nome: minúsculas, sem acentos, sem espaços extras
    const nomeNormalizado = item.nome
      ?.toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/\s+/g, ' '); // normaliza espaços

    const codigo = item.codigo?.trim();
    const codigoValido = codigoValidoParaDuplicados(codigo);

    // Verificar se nome já foi visto
    if (nomeNormalizado && nomesVistos.has(nomeNormalizado)) {
      console.log(`[removerDuplicados] DUPLICADO por nome: "${item.nome}"`);
      duplicadosRemovidos++;
      return false;
    }

    // Verificar se código já foi visto (apenas para códigos alfanuméricos válidos)
    if (codigoValido && codigo && codigosVistos.has(codigo.toUpperCase())) {
      console.log(`[removerDuplicados] DUPLICADO por código: "${codigo}" - "${item.nome}"`);
      duplicadosRemovidos++;
      return false;
    }

    // Marcar como vistos
    if (nomeNormalizado) nomesVistos.add(nomeNormalizado);
    if (codigoValido && codigo) codigosVistos.add(codigo.toUpperCase());

    return true;
  });

  if (duplicadosRemovidos > 0) {
    console.log(`[removerDuplicados] Total removidos: ${duplicadosRemovidos} de ${itens.length} itens`);
  }

  return itensUnicos;
}

/**
 * Busca produtos por categoria
 * @param categoria - Nome da categoria (ex: "Equipamentos Médicos")
 * @returns Array de produtos da categoria especificada
 *
 * NOTA: Tabela 'produtos' não existe no Supabase.
 * Esta função retorna array vazio até que a tabela seja criada.
 * Para "Instrumentação Cirúrgica CME", use getInstrumentosCMEPaginados()
 */
export async function getProdutosByCategoria(categoria: string): Promise<Produto[]> {
  // Retorna array vazio pois a tabela 'produtos' não existe
  // Apenas CME tem dados na tabela 'caixa cervical translucente'
  console.warn(`getProdutosByCategoria: Tabela 'produtos' não existe. Retornando array vazio para categoria: ${categoria}`);
  return [];
}

/**
 * Busca um único produto por slug
 * @param slug - Slug único do produto
 * @returns Produto encontrado ou null
 *
 * NOTA: Tabela 'produtos' não existe no Supabase.
 */
export async function getProdutoBySlug(slug: string): Promise<Produto | null> {
  console.warn(`getProdutoBySlug: Tabela 'produtos' não existe. Retornando null para slug: ${slug}`);
  return null;
}

/**
 * Busca todas as categorias distintas da tabela produtos
 * @returns Array de categorias únicas
 *
 * NOTA: Tabela 'produtos' não existe no Supabase.
 */
export async function getCategorias(): Promise<string[]> {
  console.warn(`getCategorias: Tabela 'produtos' não existe. Retornando array vazio.`);
  return [];
}

/**
 * Busca produtos recentes (últimos adicionados)
 * @param limit - Número de produtos a retornar
 * @returns Array de produtos recentes
 *
 * NOTA: Tabela 'produtos' não existe no Supabase.
 */
export async function getProdutosRecentes(_limit: number = 6): Promise<Produto[]> {
  console.warn(`getProdutosRecentes: Tabela 'produtos' não existe. Retornando array vazio.`);
  return [];
}

/**
 * Busca produtos por categoria usando o slug da URL
 * @param slugCategoria - Slug da categoria (ex: "equipamentos-medicos")
 * @returns Array de produtos da categoria
 */
export async function getProdutosByCategoriaSlug(slugCategoria: string): Promise<Produto[]> {
  const nomeCategoria = getCategoriaNameBySlug(slugCategoria);

  if (!nomeCategoria) {
    console.error('Categoria não encontrada para o slug:', slugCategoria);
    return [];
  }

  return getProdutosByCategoria(nomeCategoria);
}

/**
 * ========================================
 * FUNÇÕES PARA INSTRUMENTAÇÃO CIRÚRGICA CME
 * ========================================
 */

/**
 * Lista de tabelas CME conhecidas (cada tabela é uma caixa)
 * NOTA: Adicione novas tabelas aqui conforme forem criadas no Supabase
 * IMPORTANTE: Use o nome EXATO da tabela como está no Supabase (com espaços)
 */
const TABELAS_CME = [
  'caixa cervical translucente',
  'caixa de apoio alif',
  'caixa de apoio cervical',
  'caixa de apoio lombar',
  'caixa endoscopia coluna',
  'caixa baioneta mis',
  'caixa intrumentacao cirurgica cranio',
  'caixa micro tesouras',
  'caixa microdissectores rhoton',
  'kit afastadores tubulares endoscopia',
  'afastador abdominal all path – omni tract',
  'caixa apoio bucomaxilo',
  'instrumental peça de mão stryker formula',
  'instrumental de descompressão TOM SHIELD',
  'instrumental cabo de fibra óptica compatível stryker',
  // Adicione mais tabelas conforme necessário
];

/**
 * Conta itens únicos em uma tabela (sem duplicados)
 * @param nomeTabela - Nome da tabela no Supabase
 * @returns Número de itens únicos
 */
async function contarItensUnicos(nomeTabela: string): Promise<number> {
  try {
    // Buscar todos os dados da tabela (select * para garantir que pegamos todas as colunas)
    const { data, error } = await supabase
      .from(nomeTabela)
      .select('*');

    if (error || !data || data.length === 0) {
      console.log(`[contarItensUnicos] Erro ou sem dados em "${nomeTabela}":`, error?.message);
      return 0;
    }

    console.log(`[contarItensUnicos] Tabela "${nomeTabela}" tem ${data.length} registros brutos`);

    // Normalizar e contar únicos baseado no campo 'nome'
    const nomesUnicos = new Set<string>();
    data.forEach((item: any) => {
      // Tentar pegar o nome de diferentes campos possíveis
      const nome = item.nome || item.name || item.titulo || item.title;
      if (nome) {
        const nomeNormalizado = nome
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ');
        if (nomeNormalizado) {
          nomesUnicos.add(nomeNormalizado);
        }
      }
    });

    const totalUnicos = nomesUnicos.size > 0 ? nomesUnicos.size : data.length;
    console.log(`[contarItensUnicos] Tabela "${nomeTabela}" tem ${totalUnicos} itens únicos`);
    return totalUnicos;
  } catch (err) {
    console.error(`[contarItensUnicos] Erro ao contar itens de "${nomeTabela}":`, err);
    return 0;
  }
}

/**
 * Busca todas as caixas CME (cada tabela é uma caixa)
 * @returns Array de caixas com total de instrumentos (sem duplicados)
 */
export async function getCaixasCME(): Promise<CaixaCME[]> {
  console.log('[getCaixasCME] Iniciando busca de caixas...');

  const caixas: CaixaCME[] = [];

  try {
    for (const nomeTabela of TABELAS_CME) {
      console.log(`[getCaixasCME] Processando tabela: "${nomeTabela}"`);

      try {
        // Primeiro verificar se a tabela existe e tem dados
        const { data: sampleData, error: sampleError } = await supabase
          .from(nomeTabela)
          .select('*')
          .limit(1);

        if (sampleError) {
          console.error(`[getCaixasCME] Erro ao acessar tabela "${nomeTabela}":`, sampleError.message);
          continue;
        }

        if (!sampleData || sampleData.length === 0) {
          console.warn(`[getCaixasCME] Tabela "${nomeTabela}" está vazia, pulando...`);
          continue;
        }

        // Contar itens ÚNICOS (sem duplicados)
        const totalUnicos = await contarItensUnicos(nomeTabela);
        console.log(`[getCaixasCME] Tabela "${nomeTabela}" tem ${totalUnicos} itens únicos`);

        // Usar o primeiro item para imagem
        const primeiroItem = sampleData[0];
        let imagemUrl = primeiroItem?.imagem_url || primeiroItem?.imagem || null;
        if (imagemUrl === 'NULL' || imagemUrl === 'null') {
          imagemUrl = null;
        }

        const caixa: CaixaCME = {
          nome_tabela: nomeTabela,
          nome_exibicao: tabelaToNomeExibicao(nomeTabela),
          total_instrumentos: totalUnicos > 0 ? totalUnicos : 1, // Garantir pelo menos 1 se tiver dados
          imagem_url: imagemUrl,
          slug: tabelaToSlug(nomeTabela),
        };

        caixas.push(caixa);
      } catch (tableError) {
        console.error(`[getCaixasCME] ERRO ao processar tabela "${nomeTabela}":`, tableError);
      }
    }

    // Ordenar por nome de exibição
    caixas.sort((a, b) => a.nome_exibicao.localeCompare(b.nome_exibicao));

    console.log(`[getCaixasCME] Total de caixas encontradas: ${caixas.length}`);
    return caixas;
  } catch (error) {
    console.error('[getCaixasCME] ERRO FATAL na função:', error);
    return [];
  }
}

/**
 * Busca instrumentos de uma tabela CME específica com paginação
 * Remove duplicados antes de paginar para garantir contagem correta
 * @param nomeTabela - Nome da tabela no Supabase
 * @param pagina - Número da página (1-based)
 * @param porPagina - Quantidade de itens por página (padrão: 20)
 * @returns Objeto com instrumentos paginados e metadados
 */
export async function getInstrumentosDaTabela(
  nomeTabela: string,
  pagina: number = 1,
  porPagina: number = 20
): Promise<InstrumentosCMEPaginados> {
  console.log(`[getInstrumentosDaTabela] Iniciando busca em "${nomeTabela}"`);
  console.log(`[getInstrumentosDaTabela] Página: ${pagina}, Por página: ${porPagina}`);

  try {
    // Buscar TODOS os dados primeiro para remover duplicados corretamente
    console.log(`[getInstrumentosDaTabela] Buscando todos os registros...`);
    const { data, error } = await supabase
      .from(nomeTabela)
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error(`[getInstrumentosDaTabela] ERRO ao buscar instrumentos:`, error);
      throw new Error(`Erro ao buscar instrumentos: ${error.message}`);
    }

    console.log(`[getInstrumentosDaTabela] Total de registros do banco: ${data?.length || 0}`);

    // Normalizar dados: algumas tabelas usam 'imagem' e outras 'imagem_url'
    // Também gerar id e codigo quando não existem na tabela
    const instrumentosNormalizados = data?.map((item: any, index: number) => {
      let imagemUrl = item.imagem_url || item.imagem || null;
      if (imagemUrl === 'NULL' || imagemUrl === 'null') {
        imagemUrl = null;
      }

      // Gerar ID baseado no índice se não existir
      const id = item.id || (index + 1);

      // Gerar código baseado no nome se não existir
      // Tenta extrair código do início do nome (ex: "ASS185 - Afastador..." -> "ASS185")
      // Senão, usa base64url do nome para garantir unicidade e ser URL-safe
      let codigo = item.codigo;
      if (!codigo) {
        // Tentar extrair código do início do nome (padrão: LETRAS + NÚMEROS)
        const matchCodigo = item.nome?.match(/^([A-Z]{2,4}\d{2,4})\s*[-–]\s*/i);
        if (matchCodigo) {
          codigo = matchCodigo[1].toUpperCase();
        } else {
          // Fallback: usar base64url do nome
          codigo = Buffer.from(item.nome, 'utf-8').toString('base64url');
        }
      }

      return {
        ...item,
        id,
        codigo,
        imagem_url: imagemUrl,
      };
    }) || [];

    // REMOVER DUPLICADOS antes de paginar
    const instrumentosUnicos = removerDuplicados(instrumentosNormalizados);
    console.log(`[getInstrumentosDaTabela] Após remover duplicados: ${instrumentosUnicos.length}`);

    // Aplicar paginação nos itens únicos
    const offset = (pagina - 1) * porPagina;
    const instrumentosPaginados = instrumentosUnicos.slice(offset, offset + porPagina);

    const total = instrumentosUnicos.length;
    const totalPaginas = Math.ceil(total / porPagina);

    console.log(`[getInstrumentosDaTabela] Retornando página ${pagina} com ${instrumentosPaginados.length} itens`);

    return {
      instrumentos: instrumentosPaginados,
      total,
      pagina,
      porPagina,
      totalPaginas,
    };
  } catch (error) {
    console.error(`[getInstrumentosDaTabela] ERRO FATAL:`, error);
    return {
      instrumentos: [],
      total: 0,
      pagina,
      porPagina,
      totalPaginas: 0,
    };
  }
}

/**
 * DEPRECATED: Use getInstrumentosDaTabela() ao invés
 */
export async function getInstrumentosCMEPaginados(
  pagina: number = 1,
  porPagina: number = 20,
  subcategoria?: string
): Promise<InstrumentosCMEPaginados> {
  console.warn('getInstrumentosCMEPaginados está deprecated. Use getInstrumentosDaTabela()');
  return getInstrumentosDaTabela('caixa cervical translucente', pagina, porPagina);
}

/**
 * Busca um único instrumento por código em uma tabela específica
 * @param nomeTabela - Nome da tabela no Supabase
 * @param codigo - Código do produto (pode ser código real, extraído do nome, ou base64url do nome)
 * @returns Instrumento encontrado ou null
 */
export async function getInstrumentoDaTabela(
  nomeTabela: string,
  codigo: string
): Promise<InstrumentoCME | null> {
  try {
    console.log(`[getInstrumentoDaTabela] Buscando "${codigo}" em "${nomeTabela}"`);

    let data: any = null;
    let error: any = null;

    // Se o código parece ser um ID numérico, buscar por ID primeiro
    // Variável para armazenar o ID usado (seja da coluna 'id' ou do índice)
    let idUsado: number | null = null;

    // Algumas tabelas não têm coluna "id", então precisamos de fallback
    if (/^\d+$/.test(codigo)) {
      console.log(`[getInstrumentoDaTabela] Código parece ser ID numérico, buscando por id...`);
      const idBuscado = parseInt(codigo, 10);

      // Primeiro tentar buscar por coluna 'id'
      const resultado = await supabase
        .from(nomeTabela)
        .select('*')
        .eq('id', idBuscado)
        .single();

      data = resultado.data;
      error = resultado.error;

      if (error) {
        console.log(`[getInstrumentoDaTabela] Erro ao buscar por ID: ${error.message} (code: ${error.code})`);

        // Se a tabela não tem coluna 'id' (erro 42703), buscar todos e usar índice
        if (error.code === '42703') {
          console.log(`[getInstrumentoDaTabela] Tabela não tem coluna id, buscando por índice...`);
          const { data: allData, error: allError } = await supabase
            .from(nomeTabela)
            .select('*')
            .order('nome', { ascending: true });

          if (!allError && allData) {
            const idxBuscado = idBuscado - 1; // ID começa em 1, índice em 0
            if (idxBuscado >= 0 && idxBuscado < allData.length) {
              data = allData[idxBuscado];
              error = null;
              idUsado = idBuscado; // O ID é o mesmo que foi solicitado
              console.log(`[getInstrumentoDaTabela] Encontrado por índice: ${codigo} -> "${data?.nome}"`);
            }
          }
        }
      } else if (data) {
        idUsado = data.id; // Armazena o ID da coluna
      }
      if (data && !error) {
        console.log(`[getInstrumentoDaTabela] Encontrado por ID: ${codigo}`);
      }
    }

    // Se não encontrou por ID, tentar buscar por código diretamente na coluna codigo
    if (!data) {
      console.log(`[getInstrumentoDaTabela] Tentando buscar por coluna codigo...`);
      const resultado = await supabase
        .from(nomeTabela)
        .select('*')
        .eq('codigo', codigo)
        .single();

      data = resultado.data;
      error = resultado.error;
    }

    // Se não encontrou por código na coluna, tentar buscar por código no início do nome
    if (error || !data) {
      console.log(`[getInstrumentoDaTabela] Não encontrado por coluna codigo, tentando por código no nome...`);

      // Buscar todos e filtrar pelo código no início do nome
      const { data: allData, error: allError } = await supabase
        .from(nomeTabela)
        .select('*');

      if (!allError && allData) {
        // Procurar item cujo nome começa com o código
        data = allData.find((item: any) => {
          const matchCodigo = item.nome?.match(/^([A-Z]{2,4}\d{2,4})\s*[-–]\s*/i);
          return matchCodigo && matchCodigo[1].toUpperCase() === codigo.toUpperCase();
        });
        error = data ? null : { message: 'Não encontrado' } as any;
      }
    }

    // Se ainda não encontrou, tentar decodificar base64url e buscar por nome
    if (error || !data) {
      console.log(`[getInstrumentoDaTabela] Não encontrado por código no nome, tentando base64url...`);

      try {
        // Decodificar base64url para obter o nome original
        const nomeDecodificado = Buffer.from(codigo, 'base64url').toString('utf-8');
        console.log(`[getInstrumentoDaTabela] Nome decodificado: "${nomeDecodificado}"`);

        const resultado = await supabase
          .from(nomeTabela)
          .select('*')
          .eq('nome', nomeDecodificado)
          .single();

        data = resultado.data;
        error = resultado.error;
      } catch (decodeError) {
        console.log(`[getInstrumentoDaTabela] Falha ao decodificar base64url`);
      }
    }

    if (error || !data) {
      console.error(`[getInstrumentoDaTabela] Instrumento não encontrado`);
      return null;
    }

    // Normalizar: algumas tabelas usam 'imagem' e outras 'imagem_url'
    let imagemUrl = data.imagem_url || data.imagem || null;
    if (imagemUrl === 'NULL' || imagemUrl === 'null') {
      imagemUrl = null;
    }

    // Gerar código se não existir - mesma lógica de getInstrumentosDaTabela
    let codigoFinal = data.codigo;
    if (!codigoFinal) {
      const matchCodigo = data.nome?.match(/^([A-Z]{2,4}\d{2,4})\s*[-–]\s*/i);
      if (matchCodigo) {
        codigoFinal = matchCodigo[1].toUpperCase();
      } else {
        codigoFinal = Buffer.from(data.nome, 'utf-8').toString('base64url');
      }
    }

    return {
      ...data,
      id: idUsado || data.id || 1,
      codigo: codigoFinal,
      imagem_url: imagemUrl,
    };
  } catch (error) {
    console.error(`[getInstrumentoDaTabela] ERRO FATAL para "${nomeTabela}":`, error);
    return null;
  }
}

/**
 * DEPRECATED: Use getInstrumentoDaTabela() ao invés
 * Busca em todas as tabelas CME conhecidas até encontrar o código
 */
export async function getInstrumentoCMEByCodigo(codigo: string): Promise<InstrumentoCME | null> {
  console.warn('getInstrumentoCMEByCodigo está deprecated. Use getInstrumentoDaTabela()');

  // Tentar em cada tabela
  for (const nomeTabela of TABELAS_CME) {
    const instrumento = await getInstrumentoDaTabela(nomeTabela, codigo);
    if (instrumento) {
      return instrumento;
    }
  }

  return null;
}

/**
 * ========================================
 * FUNÇÕES PARA EQUIPAMENTOS MÉDICOS
 * ========================================
 */

/**
 * Lista de tabelas de Equipamentos Médicos (cada tabela é uma categoria)
 * NOTA: Adicione novas tabelas aqui conforme forem criadas no Supabase
 * IMPORTANTE: Use o nome EXATO da tabela como está no Supabase (com espaços e caracteres especiais)
 */
const TABELAS_EQUIPAMENTOS = [
  'stryker 5400-50 core console + pedal',
  'bomba de artroscopia flosteady 150',
  'gerador de radiofrequencia multigen 4 canais',
  'gerador de rf  para manejo da dor coolief',
  'gerador rf  surgimax plus + pedal',
  'gerador de diatermia ellman surgimax 4.0 dual rf 120 ice',
  'b. braun stimuplex hns12',
  'arthrocare quantum 2 rf + pedal',
  'laser lombar delight',
  // Adicione mais tabelas conforme necessário
];

/**
 * Busca todas as categorias de Equipamentos Médicos (cada tabela é uma categoria)
 * @returns Array de categorias com total de itens (sem duplicados)
 */
export async function getCategoriasEquipamentos(): Promise<CategoriaEquipamento[]> {
  console.log('[getCategoriasEquipamentos] Iniciando busca de categorias...');

  const categorias: CategoriaEquipamento[] = [];

  try {
    for (const nomeTabela of TABELAS_EQUIPAMENTOS) {
      console.log(`[getCategoriasEquipamentos] Processando tabela: "${nomeTabela}"`);

      try {
        // Primeiro verificar se a tabela existe e tem dados
        const { data: sampleData, error: sampleError } = await supabase
          .from(nomeTabela)
          .select('*')
          .limit(1);

        if (sampleError) {
          console.error(`[getCategoriasEquipamentos] Erro ao acessar tabela "${nomeTabela}":`, sampleError.message);
          continue;
        }

        if (!sampleData || sampleData.length === 0) {
          console.warn(`[getCategoriasEquipamentos] Tabela "${nomeTabela}" está vazia, pulando...`);
          continue;
        }

        // Contar itens ÚNICOS (sem duplicados)
        const totalUnicos = await contarItensUnicos(nomeTabela);
        console.log(`[getCategoriasEquipamentos] Tabela "${nomeTabela}" tem ${totalUnicos} itens únicos`);

        // Usar o primeiro item para imagem
        const primeiroItem = sampleData[0];
        let imagemUrl = primeiroItem?.imagem_url || primeiroItem?.imagem || null;
        if (imagemUrl === 'NULL' || imagemUrl === 'null') {
          imagemUrl = null;
        }

        const categoria: CategoriaEquipamento = {
          nome_tabela: nomeTabela,
          nome_exibicao: tabelaToNomeExibicao(nomeTabela),
          total_itens: totalUnicos > 0 ? totalUnicos : 1, // Garantir pelo menos 1 se tiver dados
          imagem_url: imagemUrl,
          slug: tabelaToSlug(nomeTabela),
        };

        categorias.push(categoria);
      } catch (tableError) {
        console.error(`[getCategoriasEquipamentos] ERRO ao processar tabela "${nomeTabela}":`, tableError);
      }
    }

    // Ordenar por nome
    categorias.sort((a, b) => a.nome_exibicao.localeCompare(b.nome_exibicao));

    console.log(`[getCategoriasEquipamentos] Total de categorias: ${categorias.length}`);
    return categorias;
  } catch (error) {
    console.error('[getCategoriasEquipamentos] ERRO FATAL:', error);
    return [];
  }
}

/**
 * Busca equipamentos de uma tabela específica com paginação
 * Remove duplicados antes de paginar para garantir contagem correta
 * @param nomeTabela - Nome da tabela no Supabase
 * @param pagina - Número da página (1-based)
 * @param porPagina - Quantidade de itens por página (padrão: 20)
 * @returns Objeto com equipamentos paginados e metadados
 */
export async function getEquipamentosDaTabela(
  nomeTabela: string,
  pagina: number = 1,
  porPagina: number = 20
): Promise<EquipamentosMedicosPaginados> {
  console.log(`[getEquipamentosDaTabela] Buscando em "${nomeTabela}"`);
  console.log(`[getEquipamentosDaTabela] Página: ${pagina}, Por página: ${porPagina}`);

  try {
    // Buscar TODOS os dados primeiro para remover duplicados corretamente
    const { data, error } = await supabase
      .from(nomeTabela)
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error(`[getEquipamentosDaTabela] ERRO:`, error);
      throw new Error(`Erro ao buscar equipamentos: ${error.message}`);
    }

    console.log(`[getEquipamentosDaTabela] Total de registros do banco: ${data?.length || 0}`);

    // Normalizar dados
    const equipamentosNormalizados: EquipamentoMedico[] = data?.map((item: any) => {
      let imagemUrl = item.imagem_url || item.imagem || null;
      if (imagemUrl === 'NULL' || imagemUrl === 'null') {
        imagemUrl = null;
      }
      return {
        id: item.id,
        nome: item.nome,
        categoria: item.categoria,
        codigo: item.codigo || null,
        descricao: item.descricao || null,
        imagem_url: imagemUrl,
      };
    }) || [];

    // REMOVER DUPLICADOS antes de paginar
    const equipamentosUnicos = removerDuplicados(equipamentosNormalizados);
    console.log(`[getEquipamentosDaTabela] Após remover duplicados: ${equipamentosUnicos.length}`);

    // Aplicar paginação nos itens únicos
    const offset = (pagina - 1) * porPagina;
    const equipamentosPaginados = equipamentosUnicos.slice(offset, offset + porPagina);

    const total = equipamentosUnicos.length;
    const totalPaginas = Math.ceil(total / porPagina);

    console.log(`[getEquipamentosDaTabela] Retornando página ${pagina} com ${equipamentosPaginados.length} itens`);

    return {
      equipamentos: equipamentosPaginados,
      total,
      pagina,
      porPagina,
      totalPaginas,
    };
  } catch (error) {
    console.error(`[getEquipamentosDaTabela] ERRO FATAL:`, error);
    return {
      equipamentos: [],
      total: 0,
      pagina,
      porPagina,
      totalPaginas: 0,
    };
  }
}

/**
 * Busca um equipamento específico por ID
 * @param nomeTabela - Nome da tabela no Supabase
 * @param id - ID do equipamento
 * @returns Equipamento encontrado ou null
 */
export async function getEquipamentoPorId(
  nomeTabela: string,
  id: number
): Promise<EquipamentoMedico | null> {
  try {
    const { data, error } = await supabase
      .from(nomeTabela)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[getEquipamentoPorId] ERRO:`, error);
      return null;
    }

    if (data) {
      let imagemUrl = data.imagem_url || data.imagem || null;
      if (imagemUrl === 'NULL' || imagemUrl === 'null') {
        imagemUrl = null;
      }
      return {
        id: data.id,
        nome: data.nome,
        categoria: data.categoria,
        codigo: data.codigo || null,
        descricao: data.descricao || null,
        imagem_url: imagemUrl,
      };
    }

    return null;
  } catch (error) {
    console.error(`[getEquipamentoPorId] ERRO FATAL:`, error);
    return null;
  }
}

/**
 * ========================================
 * FUNÇÕES PARA CATÁLOGO GERAL
 * ========================================
 */

/**
 * Interface para produto unificado do catálogo
 */
export interface ProdutoCatalogo {
  id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  imagem_url: string | null;
  categoria_principal: 'Instrumentação Cirúrgica CME' | 'Equipamentos Médicos';
  caixa_tabela: string;
  caixa_nome: string;
  caixa_slug: string;
}

/**
 * Interface para resultado paginado do catálogo
 */
export interface CatalogoPaginado {
  produtos: ProdutoCatalogo[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  filtros: {
    categorias: { nome: string; total: number }[];
    caixas: { nome: string; slug: string; categoria: string; total: number }[];
  };
}

/**
 * Busca TODOS os produtos de todas as tabelas (CME + Equipamentos)
 * com suporte a filtros e paginação
 */
export async function getTodosProdutosCatalogo(
  opcoes: {
    pagina?: number;
    porPagina?: number;
    busca?: string;
    categoria?: string;
    caixaSlug?: string;
    ordenacao?: 'nome-asc' | 'nome-desc' | 'recentes';
  } = {}
): Promise<CatalogoPaginado> {
  const {
    pagina = 1,
    porPagina = 24,
    busca = '',
    categoria = '',
    caixaSlug = '',
    ordenacao = 'nome-asc',
  } = opcoes;

  console.log('[getTodosProdutosCatalogo] Iniciando busca...');
  console.log('[getTodosProdutosCatalogo] Filtros:', { pagina, porPagina, busca, categoria, caixaSlug, ordenacao });

  const todosProdutos: ProdutoCatalogo[] = [];
  const contagemCategorias: Map<string, number> = new Map();
  const contagemCaixas: Map<string, { nome: string; slug: string; categoria: string; total: number }> = new Map();

  try {
    // Buscar de todas as tabelas CME
    for (const nomeTabela of TABELAS_CME) {
      try {
        const { data, error } = await supabase
          .from(nomeTabela)
          .select('*');

        if (error) {
          console.warn(`[getTodosProdutosCatalogo] Tabela CME "${nomeTabela}" erro:`, error.message);
          continue;
        }
        if (!data || data.length === 0) {
          console.log(`[getTodosProdutosCatalogo] Tabela CME "${nomeTabela}": ${data?.length || 0} itens`);
          continue;
        }

        console.log(`[getTodosProdutosCatalogo] Tabela CME "${nomeTabela}": ${data.length} itens`);

        const caixaNome = tabelaToNomeExibicao(nomeTabela);
        const caixaSlugAtual = tabelaToSlug(nomeTabela);

        data.forEach((item: any, index: number) => {
          let imagemUrl = item.imagem_url || item.imagem || null;
          if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

          // Gerar código se não existir - IMPORTANTE: usar base64url para garantir URL válida
          let codigo = item.codigo;
          if (!codigo) {
            const matchCodigo = item.nome?.match(/^([A-Z]{2,4}\d{2,4})\s*[-–]\s*/i);
            if (matchCodigo) {
              codigo = matchCodigo[1].toUpperCase();
            } else {
              // Fallback: usar base64url do nome para garantir unicidade e ser URL-safe
              codigo = Buffer.from(item.nome || `item-${index}`, 'utf-8').toString('base64url');
            }
          }

          todosProdutos.push({
            id: `cme-${nomeTabela}-${item.id || index}`,
            nome: item.nome,
            codigo,
            descricao: item.descricao || null,
            imagem_url: imagemUrl,
            categoria_principal: 'Instrumentação Cirúrgica CME',
            caixa_tabela: nomeTabela,
            caixa_nome: caixaNome,
            caixa_slug: caixaSlugAtual,
          });
        });

        // Atualizar contagem
        const totalCaixa = contagemCaixas.get(caixaSlugAtual)?.total || 0;
        contagemCaixas.set(caixaSlugAtual, {
          nome: caixaNome,
          slug: caixaSlugAtual,
          categoria: 'Instrumentação Cirúrgica CME',
          total: totalCaixa + data.length,
        });
      } catch (err) {
        console.error(`[getTodosProdutosCatalogo] Erro em tabela CME "${nomeTabela}":`, err);
      }
    }

    // Buscar de todas as tabelas de Equipamentos
    for (const nomeTabela of TABELAS_EQUIPAMENTOS) {
      try {
        const { data, error } = await supabase
          .from(nomeTabela)
          .select('*');

        if (error) {
          console.warn(`[getTodosProdutosCatalogo] Tabela Equip "${nomeTabela}" erro:`, error.message);
          continue;
        }
        if (!data || data.length === 0) {
          console.log(`[getTodosProdutosCatalogo] Tabela Equip "${nomeTabela}": ${data?.length || 0} itens`);
          continue;
        }

        console.log(`[getTodosProdutosCatalogo] Tabela Equip "${nomeTabela}": ${data.length} itens`);

        const caixaNome = tabelaToNomeExibicao(nomeTabela);
        const caixaSlugAtual = tabelaToSlug(nomeTabela);

        data.forEach((item: any, index: number) => {
          let imagemUrl = item.imagem_url || item.imagem || null;
          if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

          // Gerar código/ID para equipamentos
          let idEquipamento = String(item.id || index);

          todosProdutos.push({
            id: `equip-${nomeTabela}-${item.id || index}`,
            nome: item.nome,
            codigo: idEquipamento,
            descricao: item.descricao || null,
            imagem_url: imagemUrl,
            categoria_principal: 'Equipamentos Médicos',
            caixa_tabela: nomeTabela,
            caixa_nome: caixaNome,
            caixa_slug: caixaSlugAtual,
          });
        });

        // Atualizar contagem
        const totalCaixa = contagemCaixas.get(caixaSlugAtual)?.total || 0;
        contagemCaixas.set(caixaSlugAtual, {
          nome: caixaNome,
          slug: caixaSlugAtual,
          categoria: 'Equipamentos Médicos',
          total: totalCaixa + data.length,
        });
      } catch (err) {
        console.error(`[getTodosProdutosCatalogo] Erro em tabela Equip "${nomeTabela}":`, err);
      }
    }

    console.log(`[getTodosProdutosCatalogo] Total bruto: ${todosProdutos.length} produtos`);

    // Remover duplicados
    const produtosUnicos = removerDuplicados(todosProdutos);
    console.log(`[getTodosProdutosCatalogo] Após remover duplicados: ${produtosUnicos.length}`);

    // Atualizar contagem de categorias
    produtosUnicos.forEach(p => {
      const count = contagemCategorias.get(p.categoria_principal) || 0;
      contagemCategorias.set(p.categoria_principal, count + 1);
    });

    // Aplicar filtros
    let produtosFiltrados = produtosUnicos;

    // Filtro de busca avançado - procura em todos os campos
    if (busca) {
      const buscaLower = busca.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const palavrasBusca = buscaLower.split(/\s+/).filter(p => p.length > 0);

      produtosFiltrados = produtosFiltrados.filter(p => {
        // Criar texto completo para busca
        const textoCompleto = [
          p.nome,
          p.descricao,
          p.codigo,
          p.caixa_nome,
          p.categoria_principal
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        // Verificar se TODAS as palavras da busca estão no texto
        return palavrasBusca.every(palavra => textoCompleto.includes(palavra));
      });

      // Ordenar por relevância quando há busca
      produtosFiltrados.sort((a, b) => {
        const nomeA = a.nome?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
        const nomeB = b.nome?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

        // Prioridade 1: Nome começa com o termo de busca
        const aComeca = nomeA.startsWith(buscaLower) ? 1 : 0;
        const bComeca = nomeB.startsWith(buscaLower) ? 1 : 0;
        if (aComeca !== bComeca) return bComeca - aComeca;

        // Prioridade 2: Nome contém o termo exato
        const aContemExato = nomeA.includes(buscaLower) ? 1 : 0;
        const bContemExato = nomeB.includes(buscaLower) ? 1 : 0;
        if (aContemExato !== bContemExato) return bContemExato - aContemExato;

        // Prioridade 3: Código igual ao termo
        const codigoA = (a.codigo || '').toLowerCase();
        const codigoB = (b.codigo || '').toLowerCase();
        if (codigoA === buscaLower) return -1;
        if (codigoB === buscaLower) return 1;

        // Ordem alfabética como fallback
        return nomeA.localeCompare(nomeB, 'pt-BR');
      });
    }

    // Filtro de categoria principal
    if (categoria) {
      produtosFiltrados = produtosFiltrados.filter(p => p.categoria_principal === categoria);
    }

    // Filtro de caixa/conjunto
    if (caixaSlug) {
      produtosFiltrados = produtosFiltrados.filter(p => p.caixa_slug === caixaSlug);
    }

    // Ordenação
    produtosFiltrados.sort((a, b) => {
      switch (ordenacao) {
        case 'nome-desc':
          return b.nome.localeCompare(a.nome, 'pt-BR');
        case 'recentes':
          return 0; // Manter ordem original (mais recentes primeiro se disponível)
        case 'nome-asc':
        default:
          return a.nome.localeCompare(b.nome, 'pt-BR');
      }
    });

    // Paginação
    const total = produtosFiltrados.length;
    const totalPaginas = Math.ceil(total / porPagina);
    const offset = (pagina - 1) * porPagina;
    const produtosPaginados = produtosFiltrados.slice(offset, offset + porPagina);

    console.log(`[getTodosProdutosCatalogo] Retornando página ${pagina} com ${produtosPaginados.length} produtos`);

    return {
      produtos: produtosPaginados,
      total,
      pagina,
      porPagina,
      totalPaginas,
      filtros: {
        categorias: Array.from(contagemCategorias.entries()).map(([nome, total]) => ({ nome, total })),
        caixas: Array.from(contagemCaixas.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      },
    };
  } catch (error) {
    console.error('[getTodosProdutosCatalogo] ERRO FATAL:', error);
    return {
      produtos: [],
      total: 0,
      pagina,
      porPagina,
      totalPaginas: 0,
      filtros: { categorias: [], caixas: [] },
    };
  }
}

/**
 * Exporta as listas de tabelas para uso em outros módulos
 */
export { TABELAS_CME, TABELAS_EQUIPAMENTOS };

/**
 * Interface para produto relacionado
 */
export interface ProdutoRelacionado {
  id: string | number;
  nome: string;
  codigo: string | null;
  imagem_url: string | null;
  categoria: 'Instrumentação Cirúrgica CME' | 'Equipamentos Médicos';
  caixa_tabela: string;
  caixa_nome: string;
  caixa_slug: string;
}

/**
 * Busca produtos relacionados a um produto específico
 * Prioriza produtos da mesma caixa/categoria
 */
export async function getProdutosRelacionados(
  nomeTabela: string,
  produtoAtualId: string | number,
  categoria: 'Instrumentação Cirúrgica CME' | 'Equipamentos Médicos',
  limite: number = 4
): Promise<ProdutoRelacionado[]> {
  console.log(`[getProdutosRelacionados] Buscando produtos relacionados para "${nomeTabela}", id: ${produtoAtualId}`);

  const relacionados: ProdutoRelacionado[] = [];
  const caixaSlug = tabelaToSlug(nomeTabela);
  const caixaNome = tabelaToNomeExibicao(nomeTabela);

  try {
    // 1. Buscar outros produtos da MESMA CAIXA (mais relevante)
    const { data: mesmaCaixa, error: erroMesmaCaixa } = await supabase
      .from(nomeTabela)
      .select('*')
      .limit(limite + 1); // +1 para compensar se o atual estiver incluído

    if (!erroMesmaCaixa && mesmaCaixa) {
      mesmaCaixa.forEach((item: any, index: number) => {
        // Excluir o produto atual
        const itemId = item.id || index;
        if (String(itemId) === String(produtoAtualId)) return;
        if (relacionados.length >= limite) return;

        let imagemUrl = item.imagem_url || item.imagem || null;
        if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

        // Gerar código se não existir
        let codigo = item.codigo;
        if (!codigo) {
          const matchCodigo = item.nome?.match(/^([A-Z]{2,4}\d{2,4})\s*[-–]\s*/i);
          if (matchCodigo) {
            codigo = matchCodigo[1].toUpperCase();
          } else {
            codigo = Buffer.from(item.nome || `item-${index}`, 'utf-8').toString('base64url');
          }
        }

        relacionados.push({
          id: itemId,
          nome: item.nome,
          codigo,
          imagem_url: imagemUrl,
          categoria,
          caixa_tabela: nomeTabela,
          caixa_nome: caixaNome,
          caixa_slug: caixaSlug,
        });
      });
    }

    // 2. Se não tiver suficiente, buscar de outras caixas da mesma categoria
    if (relacionados.length < limite) {
      const faltam = limite - relacionados.length;
      const outrasCaixas = categoria === 'Instrumentação Cirúrgica CME'
        ? TABELAS_CME.filter(t => t !== nomeTabela)
        : TABELAS_EQUIPAMENTOS.filter(t => t !== nomeTabela);

      // Pegar algumas caixas aleatórias para variedade
      const caixasSelecionadas = outrasCaixas.sort(() => Math.random() - 0.5).slice(0, 3);

      for (const outraCaixa of caixasSelecionadas) {
        if (relacionados.length >= limite) break;

        const { data, error } = await supabase
          .from(outraCaixa)
          .select('*')
          .limit(faltam);

        if (!error && data) {
          const outraCaixaSlug = tabelaToSlug(outraCaixa);
          const outraCaixaNome = tabelaToNomeExibicao(outraCaixa);

          data.forEach((item: any, index: number) => {
            if (relacionados.length >= limite) return;

            let imagemUrl = item.imagem_url || item.imagem || null;
            if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

            // Gerar código se não existir
            let codigo = item.codigo;
            if (!codigo) {
              const matchCodigo = item.nome?.match(/^([A-Z]{2,4}\d{2,4})\s*[-–]\s*/i);
              if (matchCodigo) {
                codigo = matchCodigo[1].toUpperCase();
              } else {
                codigo = Buffer.from(item.nome || `item-${index}`, 'utf-8').toString('base64url');
              }
            }

            relacionados.push({
              id: item.id || index,
              nome: item.nome,
              codigo,
              imagem_url: imagemUrl,
              categoria,
              caixa_tabela: outraCaixa,
              caixa_nome: outraCaixaNome,
              caixa_slug: outraCaixaSlug,
            });
          });
        }
      }
    }

    console.log(`[getProdutosRelacionados] Encontrados ${relacionados.length} produtos relacionados`);
    return relacionados.slice(0, limite);
  } catch (error) {
    console.error('[getProdutosRelacionados] Erro:', error);
    return [];
  }
}

/**
 * Interface para variação de instrumento
 */
export interface VariacaoInstrumento {
  id: number;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  imagem_url: string | null;
  variacaoTexto: string;
  tipoVariacao: 'numero' | 'medida' | null;
}

/**
 * Padrões para detectar variações nos nomes
 *
 * Exemplos detectados:
 * - Nº00, Nº1, N°2, #3 (números)
 * - 18CM, 24CM, 110MM, 130MM (medidas simples)
 * - x18CM, x24CM (medidas com x)
 * - 35x23mm, 45x23mm (medidas compostas DIMxDIM)
 * - X 3MM, X 4MM, X 5MM (variações com X separado)
 * - 10,0MM, 12,0MM (medidas com decimal)
 */

// Padrão para números: Nº1, Nº00, N°2, #3, etc
const PADRAO_NUMERO = /\s*(Nº?\s*\d+|N[°º]?\s*\d+|#\d+)$/i;

// Padrão para medidas compostas: 35x23mm, 45x23mm, 25 X 110MM, etc
const PADRAO_MEDIDA_COMPOSTA = /\s*(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?$/i;

// Padrão para medidas simples no final: 18CM, 110MM, x24CM, X 3MM, 10,0MM
const PADRAO_MEDIDA_SIMPLES = /\s*[xX×]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m|"|'|pol|polegadas?)$/i;

/**
 * Extrai nome base e variação de um nome de instrumento
 * Detecta padrões de número (Nº1, Nº2) e medidas (18CM, 35x23mm, etc)
 */
function extrairVariacaoDoNome(nome: string): { nomeBase: string; variacao: string | null; tipo: 'numero' | 'medida' | null } {
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

  // 2. Tenta detectar medidas compostas (35x23mm, 25 X 110MM, etc)
  const matchComposta = nome.match(PADRAO_MEDIDA_COMPOSTA);
  if (matchComposta) {
    const dim1 = matchComposta[1];
    const dim2 = matchComposta[2];
    const unidade = (matchComposta[3] || 'mm').toUpperCase();
    return {
      nomeBase: nome.replace(PADRAO_MEDIDA_COMPOSTA, '').trim(),
      variacao: `${dim1}x${dim2}${unidade}`,
      tipo: 'medida'
    };
  }

  // 3. Tenta detectar medidas simples (18CM, x24CM, X 5MM, 10,0MM)
  const matchSimples = nome.match(PADRAO_MEDIDA_SIMPLES);
  if (matchSimples) {
    const valor = matchSimples[1].replace(',', '.');
    const unidade = matchSimples[2].toUpperCase();
    return {
      nomeBase: nome.replace(PADRAO_MEDIDA_SIMPLES, '').trim(),
      variacao: `${valor}${unidade}`,
      tipo: 'medida'
    };
  }

  return { nomeBase: nome, variacao: null, tipo: null };
}

/**
 * Formata a variação para exibição
 */
function formatarVariacaoTexto(variacao: string, tipo: 'numero' | 'medida' | null): string {
  if (!variacao) return '';

  if (tipo === 'medida') {
    const limpo = variacao.trim();
    if (!limpo.startsWith('x') && !limpo.startsWith('X')) {
      return `x${limpo}`;
    }
    return limpo;
  }

  return variacao;
}

/**
 * Busca variações de um instrumento pelo nome base
 * Também busca por similaridade de nome quando o instrumento atual não tem padrão de variação
 * @param nomeTabela - Nome da tabela no Supabase
 * @param instrumentoId - ID do instrumento atual
 * @returns Array de variações do mesmo instrumento
 */
export async function getVariacoesInstrumento(
  nomeTabela: string,
  instrumentoId: number
): Promise<VariacaoInstrumento[]> {
  console.log(`[getVariacoesInstrumento] Buscando variações para ID ${instrumentoId} em "${nomeTabela}"`);

  try {
    // Buscar TODOS os instrumentos da tabela (necessário para tabelas sem coluna 'id')
    const { data: todosInstrumentos, error: errorTodos } = await supabase
      .from(nomeTabela)
      .select('*')
      .order('nome', { ascending: true });

    if (errorTodos || !todosInstrumentos) {
      console.error('[getVariacoesInstrumento] Erro ao buscar instrumentos:', errorTodos);
      return [];
    }

    // Encontrar o instrumento atual pelo ID ou pelo índice
    let instrumentoAtual: any = null;

    // Primeiro tentar encontrar por coluna 'id' se existir
    instrumentoAtual = todosInstrumentos.find(item => item.id === instrumentoId);

    // Se não encontrou, usar índice (para tabelas sem coluna 'id')
    if (!instrumentoAtual && instrumentoId > 0 && instrumentoId <= todosInstrumentos.length) {
      instrumentoAtual = todosInstrumentos[instrumentoId - 1]; // ID começa em 1, índice em 0
      console.log(`[getVariacoesInstrumento] Usando índice ${instrumentoId - 1} para encontrar instrumento`);
    }

    if (!instrumentoAtual) {
      console.warn('[getVariacoesInstrumento] Instrumento atual não encontrado');
      return [];
    }

    // Extrair nome base do instrumento atual
    const { nomeBase, variacao: variacaoAtual } = extrairVariacaoDoNome(instrumentoAtual.nome);
    console.log(`[getVariacoesInstrumento] Nome base: "${nomeBase}", variação atual: "${variacaoAtual}"`);

    // Filtrar os que têm o mesmo nome base
    const variacoes: VariacaoInstrumento[] = [];
    const nomeBaseNormalizado = nomeBase.toLowerCase().trim();
    const nomeInstrumentoNormalizado = instrumentoAtual.nome.toLowerCase().trim();

    for (let idx = 0; idx < todosInstrumentos.length; idx++) {
      const item = todosInstrumentos[idx];
      const { nomeBase: itemBase, variacao, tipo } = extrairVariacaoDoNome(item.nome);
      const itemBaseNormalizado = itemBase.toLowerCase().trim();

      // Verificar se tem o mesmo nome base E tem variação
      // OU se o nome base do item contém o nome do instrumento atual (ou vice-versa)
      const mesmoNomeBase = itemBaseNormalizado === nomeBaseNormalizado;
      const nomesSimilares = !variacaoAtual && (
        itemBaseNormalizado.includes(nomeInstrumentoNormalizado) ||
        nomeInstrumentoNormalizado.includes(itemBaseNormalizado)
      );

      if ((mesmoNomeBase || nomesSimilares) && variacao) {
        let imagemUrl = item.imagem_url || item.imagem || null;
        if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

        // Usar item.id se existir, senão usar índice + 1 (para tabelas sem coluna 'id')
        const itemId = item.id ?? (idx + 1);

        variacoes.push({
          id: itemId,
          nome: item.nome,
          codigo: item.codigo || null,
          descricao: item.descricao || null,
          imagem_url: imagemUrl,
          variacaoTexto: formatarVariacaoTexto(variacao, tipo),
          tipoVariacao: tipo,
        });
      }
    }

    // Se o instrumento atual não está na lista de variações mas tem variações relacionadas,
    // adicionar ele como primeira opção
    if (variacoes.length > 0 && !variacoes.find(v => v.id === instrumentoId)) {
      let imagemUrl = instrumentoAtual.imagem_url || instrumentoAtual.imagem || null;
      if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

      variacoes.unshift({
        id: instrumentoAtual.id,
        nome: instrumentoAtual.nome,
        codigo: instrumentoAtual.codigo || null,
        descricao: instrumentoAtual.descricao || null,
        imagem_url: imagemUrl,
        variacaoTexto: 'Original',
        tipoVariacao: null,
      });
    }

    // Ordenar variações: numérica ou por medida
    variacoes.sort((a, b) => {
      // Extrair número da variação para ordenação
      const numA = parseInt(a.variacaoTexto.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.variacaoTexto.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    console.log(`[getVariacoesInstrumento] Encontradas ${variacoes.length} variações`);
    return variacoes;
  } catch (error) {
    console.error('[getVariacoesInstrumento] Erro:', error);
    return [];
  }
}

/**
 * Busca variações de um equipamento pelo nome base
 * Também busca por similaridade de nome quando o equipamento atual não tem padrão de variação
 * @param nomeTabela - Nome da tabela no Supabase
 * @param equipamentoId - ID do equipamento atual
 * @returns Array de variações do mesmo equipamento
 */
export async function getVariacoesEquipamento(
  nomeTabela: string,
  equipamentoId: number
): Promise<VariacaoInstrumento[]> {
  console.log(`[getVariacoesEquipamento] Buscando variações para ID ${equipamentoId} em "${nomeTabela}"`);

  try {
    // Buscar TODOS os equipamentos da tabela (necessário para tabelas sem coluna 'id')
    const { data: todosEquipamentos, error: errorTodos } = await supabase
      .from(nomeTabela)
      .select('*')
      .order('nome', { ascending: true });

    if (errorTodos || !todosEquipamentos) {
      console.error('[getVariacoesEquipamento] Erro ao buscar equipamentos:', errorTodos);
      return [];
    }

    // Encontrar o equipamento atual pelo ID ou pelo índice
    let equipamentoAtual: any = null;

    // Primeiro tentar encontrar por coluna 'id' se existir
    equipamentoAtual = todosEquipamentos.find(item => item.id === equipamentoId);

    // Se não encontrou, usar índice (para tabelas sem coluna 'id')
    if (!equipamentoAtual && equipamentoId > 0 && equipamentoId <= todosEquipamentos.length) {
      equipamentoAtual = todosEquipamentos[equipamentoId - 1]; // ID começa em 1, índice em 0
      console.log(`[getVariacoesEquipamento] Usando índice ${equipamentoId - 1} para encontrar equipamento`);
    }

    if (!equipamentoAtual) {
      console.warn('[getVariacoesEquipamento] Equipamento atual não encontrado');
      return [];
    }

    // Extrair nome base do equipamento atual
    const { nomeBase, variacao: variacaoAtual } = extrairVariacaoDoNome(equipamentoAtual.nome);
    console.log(`[getVariacoesEquipamento] Nome base: "${nomeBase}", variação atual: "${variacaoAtual}"`);

    // Filtrar os que têm o mesmo nome base
    const variacoes: VariacaoInstrumento[] = [];
    const nomeBaseNormalizado = nomeBase.toLowerCase().trim();
    const nomeEquipamentoNormalizado = equipamentoAtual.nome.toLowerCase().trim();

    for (let idx = 0; idx < todosEquipamentos.length; idx++) {
      const item = todosEquipamentos[idx];
      const { nomeBase: itemBase, variacao, tipo } = extrairVariacaoDoNome(item.nome);
      const itemBaseNormalizado = itemBase.toLowerCase().trim();

      // Verificar se tem o mesmo nome base E tem variação
      // OU se o nome base do item contém o nome do equipamento atual (ou vice-versa)
      const mesmoNomeBase = itemBaseNormalizado === nomeBaseNormalizado;
      const nomesSimilares = !variacaoAtual && (
        itemBaseNormalizado.includes(nomeEquipamentoNormalizado) ||
        nomeEquipamentoNormalizado.includes(itemBaseNormalizado)
      );

      if ((mesmoNomeBase || nomesSimilares) && variacao) {
        let imagemUrl = item.imagem_url || item.imagem || null;
        if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

        // Usar item.id se existir, senão usar índice + 1 (para tabelas sem coluna 'id')
        const itemId = item.id ?? (idx + 1);

        variacoes.push({
          id: itemId,
          nome: item.nome,
          codigo: item.codigo || null,
          descricao: item.descricao || null,
          imagem_url: imagemUrl,
          variacaoTexto: formatarVariacaoTexto(variacao, tipo),
          tipoVariacao: tipo,
        });
      }
    }

    // Se o equipamento atual não está na lista de variações mas tem variações relacionadas,
    // adicionar ele como primeira opção
    if (variacoes.length > 0 && !variacoes.find(v => v.id === equipamentoId)) {
      let imagemUrl = equipamentoAtual.imagem_url || equipamentoAtual.imagem || null;
      if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

      variacoes.unshift({
        id: equipamentoAtual.id ?? equipamentoId,
        nome: equipamentoAtual.nome,
        codigo: equipamentoAtual.codigo || null,
        descricao: equipamentoAtual.descricao || null,
        imagem_url: imagemUrl,
        variacaoTexto: 'Original',
        tipoVariacao: null,
      });
    }

    // Ordenar variações: numérica ou por medida
    variacoes.sort((a, b) => {
      const numA = parseInt(a.variacaoTexto.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.variacaoTexto.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    console.log(`[getVariacoesEquipamento] Encontradas ${variacoes.length} variações`);
    return variacoes;
  } catch (error) {
    console.error('[getVariacoesEquipamento] Erro:', error);
    return [];
  }
}
