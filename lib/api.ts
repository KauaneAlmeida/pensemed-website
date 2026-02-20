import { supabase } from './supabaseClient';
import { Produto, getCategoriaNameBySlug, InstrumentoCME, InstrumentosCMEPaginados, CaixaCME, tabelaToNomeExibicao, tabelaToSlug, CategoriaEquipamento, EquipamentoMedico, EquipamentosMedicosPaginados, ProdutoOPME, ProdutosOPMEPaginados } from './types';
import { unstable_cache } from 'next/cache';
import { devLog, logError, CACHE_CONFIG } from './cache';
import { produtoDeveSerOcultoDaTabela, produtoOPMEDeveSerOculto } from './instrumentUtils';
import { getProductImagesServer, corrigirUrlImagem } from './productImagesServer';

// Flag para habilitar/desabilitar logs detalhados
const ENABLE_DETAILED_LOGS = process.env.NODE_ENV === 'development';

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
      if (ENABLE_DETAILED_LOGS) devLog(`[removerDuplicados] DUPLICADO por nome: "${item.nome}"`);
      duplicadosRemovidos++;
      return false;
    }

    // Verificar se código já foi visto (apenas para códigos alfanuméricos válidos)
    if (codigoValido && codigo && codigosVistos.has(codigo.toUpperCase())) {
      if (ENABLE_DETAILED_LOGS) devLog(`[removerDuplicados] DUPLICADO por código: "${codigo}" - "${item.nome}"`);
      duplicadosRemovidos++;
      return false;
    }

    // Marcar como vistos
    if (nomeNormalizado) nomesVistos.add(nomeNormalizado);
    if (codigoValido && codigo) codigosVistos.add(codigo.toUpperCase());

    return true;
  });

  if (duplicadosRemovidos > 0 && ENABLE_DETAILED_LOGS) {
    devLog(`[removerDuplicados] Total removidos: ${duplicadosRemovidos} de ${itens.length} itens`);
  }

  return itensUnicos;
}

/**
 * Busca os IDs/nomes dos produtos que têm imagem cadastrada em uma tabela de imagens
 * @param tabelaImagens - Nome da tabela de imagens (ex: caixa_cervical_translucente_imagens)
 * @returns Set com produto_id ou produto_nome dos produtos com imagem
 */
async function getProdutosComImagem(tabelaImagens: string): Promise<Set<string | number>> {
  const produtosComImagem = new Set<string | number>();

  try {
    // Verificar se a tabela usa produto_nome em vez de produto_id
    const usaProdutoNome = TABELAS_COM_PRODUTO_NOME.includes(tabelaImagens);

    // Verificar se é tabela com estrutura especial
    const estruturaEspecial = TABELAS_ESTRUTURA_ESPECIAL_API[tabelaImagens];

    let campo = 'produto_id';
    if (usaProdutoNome) {
      campo = 'produto_nome';
    } else if (estruturaEspecial) {
      campo = 'nome'; // Tabelas especiais usam 'nome'
    }

    const { data, error } = await supabase
      .from(tabelaImagens)
      .select(campo);

    if (error) {
      console.log(`[getProdutosComImagem] Erro ao buscar em "${tabelaImagens}":`, error.message);
      return produtosComImagem;
    }

    if (data) {
      data.forEach((item: any) => {
        const valor = item[campo];
        if (valor !== null && valor !== undefined) {
          produtosComImagem.add(valor);
        }
      });
    }

    console.log(`[getProdutosComImagem] ${tabelaImagens}: ${produtosComImagem.size} produtos com imagem`);
  } catch (err) {
    console.error(`[getProdutosComImagem] Erro:`, err);
  }

  return produtosComImagem;
}

/**
 * Ordena produtos priorizando os que têm imagem
 * @param produtos - Array de produtos para ordenar
 * @param produtosComImagem - Set com IDs/nomes dos produtos que têm imagem
 * @param campoId - Campo usado para verificar se tem imagem ('id' ou 'nome')
 * @returns Array ordenado: primeiro os com imagem (alfabético), depois sem imagem (alfabético)
 */
function ordenarPorImagem<T extends { nome: string; id?: string | number }>(
  produtos: T[],
  produtosComImagem: Set<string | number>,
  campoId: 'id' | 'nome' = 'id'
): T[] {
  return produtos.sort((a, b) => {
    const aTemImagem = campoId === 'id'
      ? produtosComImagem.has(a.id!)
      : produtosComImagem.has(a.nome) || produtosComImagem.has(a.nome.toLowerCase());
    const bTemImagem = campoId === 'id'
      ? produtosComImagem.has(b.id!)
      : produtosComImagem.has(b.nome) || produtosComImagem.has(b.nome.toLowerCase());

    // Primeiro critério: produtos com imagem vêm primeiro
    if (aTemImagem && !bTemImagem) return -1;
    if (!aTemImagem && bTemImagem) return 1;

    // Segundo critério: ordenação alfabética por nome
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
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
  // 'caixa endoscopia coluna', // Oculto: instrumentos exibidos via caixa-pincas-estenose
  // 'caixa baioneta mis', // Oculto temporariamente
  'caixa intrumentacao cirurgica cranio',
  'caixa micro tesouras',
  'caixa microdissectores rhoton',
  // 'kit afastadores tubulares endoscopia', // Oculto temporariamente
  'afastador abdominal all path – omni tract',
  'caixa apoio bucomaxilo',
  'instrumental peça de mão stryker formula',
  'instrumental de descompressão TOM SHIELD',
  'instrumental cabo de fibra óptica compatível stryker',
  'caixa_razek_interlaminar_transforaminal',
  'caixa_endoline_interlaminar',
  'caixa_instrucao_biportal_ube',
  'craniotomo_drill_eletrico',
  'sistema_hibrido_easycore_hip',
  'caixa-pincas-estenose',
  'kit-eletrodos-radiofrequencia',
  'kit-instrumental-extracao-parafusos',
  'conjunto-formao-cirurgico-ortopedia',
  'caixa-pincas-artroscopia',
  'alicate-bernadao-45cm-steiman',
  'perfurador-serra-stryker-system-7-bateria',
  'caixa-artroscopia-pe-tornozelo',
  'passador-fio-kirschner-stryker-system-7',
  'caixa-instrumentais-artroscopia-joelho-lca-lcp',
  'caixa_artroscopia_cotovelo',
  'caixa_artroscopia_ombro',
  'equipamentos_cme',
  // Adicione mais tabelas conforme necessário
];

/**
 * Mapeamento de tabelas de produtos para suas tabelas de imagens
 * NOTA: Este mapeamento é usado para buscar imagens das caixas na listagem
 */
const MAPEAMENTO_TABELAS_IMAGENS: Record<string, string> = {
  'afastador abdominal all path – omni tract': 'afastador_abdominal_all_path_imagens',
  'caixa cervical translucente': 'caixa_cervical_translucente_imagens',
  'caixa de apoio alif': 'caixa_de_apoio_alif_imagens',
  'caixa de apoio cervical': 'caixa_de_apoio_cervical_imagens',
  'caixa de apoio lombar': 'caixa_de_apoio_lombar_imagens',
  'caixa endoscopia coluna': 'caixa_endoscopia_coluna_imagens',
  'caixa baioneta mis': 'caixa_baioneta_mis_imagens',
  'caixa intrumentacao cirurgica cranio': 'caixa_intrumentacao_cirurgica_cranio_imagens',
  'caixa micro tesouras': 'caixa_micro_tesouras_imagens',
  'caixa microdissectores rhoton': 'caixa_microdissectores_rhoton_imagens',
  'kit afastadores tubulares endoscopia': 'kit_afastadores_tubulares_endoscopia_imagens',
  'caixa apoio bucomaxilo': 'caixa_apoio_bucomaxilo_imagens',
  'instrumental peça de mão stryker formula': 'instrumental_peca_de_mao_stryker_formula_imagens',
  'instrumental de descompressão TOM SHIELD': 'instrumental_de_descompressao_tom_shield_imagens',
  'instrumental cabo de fibra óptica compatível stryker': 'instrumental_cabo_de_fibra_optica_compativel_stryker_imagens',
  'caixa_razek_interlaminar_transforaminal': 'caixa_razek_interlaminar_transforaminal_imagens',
  'caixa_endoline_interlaminar': 'caixa_endoline_interlaminar_imagens',
  'caixa_instrucao_biportal_ube': 'caixa_instrucao_biportal_ube_imagens',
  'craniotomo_drill_eletrico': 'craniotomo_drill_eletrico_imagens',
  'sistema_hibrido_easycore_hip': 'sistema_hibrido_easycore_hip_imagens',
  // Equipamentos médicos (nomes EXATOS das tabelas no Supabase)
  'arthrocare quantum 2 rf + pedal': 'arthrocare_quantum_2_rf_pedal_imagens',
  'b. braun stimuplex hns12': 'b_braun_stimuplex_hns12_imagens',
  'bomba de artroscopia flosteady 150': 'bomba_de_artroscopia_flosteady_imagens',
  'gerador de diatermia ellman surgimax 4.0 dual rf 120 ice': 'gerador_de_diatermia_ellman_surgitron_dual_rf_120_ice_imagens',
  'gerador de radiofrequencia multigen 4 canais': 'gerador_de_radiofrequencia_multigen_imagens',
  'gerador de rf  para manejo da dor coolief': 'gerador_de_rf_para_manejo_da_dor_coolief_imagens',
  'gerador rf  surgimax plus + pedal': 'gerador_rf_surgimax_plus_pedal_imagens',
  'laser lombar delight': 'laser_para_hernia_de_disco_lombar_delight_imagens',
  'stryker 5400-50 core console + pedal': 'stryker_core_console_pedal_imagens',
  'torniquete_eletronico': 'torniquete_eletronico_imagens',
  'bisturi_eletronico_wavetronic': 'bisturi_eletronico_wavetronic_imagens',
  'equipamentos_medicos': 'equipamentos_medicos_imagens',
  'kit_cirurgico_easycore_hip': 'kit_cirurgico_easycore_hip_imagens',
  'caixa-pincas-estenose': 'caixa_pincas_estenose_imagens',
  'kit-eletrodos-radiofrequencia': 'kit_eletrodos_radiofrequencia_imagens',
  'kit-instrumental-extracao-parafusos': 'kit_instrumental_extracao_parafusos_imagens',
  'conjunto-formao-cirurgico-ortopedia': 'conjunto_formao_cirurgico_ortopedia_imagens',
  'caixa-pincas-artroscopia': 'caixa_pincas_artroscopia_imagens',
  'alicate-bernadao-45cm-steiman': 'alicate_bernadao_45cm_steiman_imagens',
  'perfurador-serra-stryker-system-7-bateria': 'perfurador_serra_stryker_system_7_bateria_imagens',
  'caixa-artroscopia-pe-tornozelo': 'caixa_artroscopia_pe_tornozelo_imagens',
  'passador-fio-kirschner-stryker-system-7': 'passador_fio_kirschner_stryker_system_7_imagens',
  'caixa-instrumentais-artroscopia-joelho-lca-lcp': 'caixa_instrumentais_artroscopia_joelho_lca_lcp_imagens',
  'kit-brocas-diamantadas-biometal': 'kit_brocas_diamantadas_biometal_imagens',
  'caixa_artroscopia_cotovelo': 'caixa_artroscopia_cotovelo_imagens',
  'caixa_artroscopia_ombro': 'caixa_artroscopia_ombro_imagens',
  'equipamentos_cme': 'equipamentos_cme_imagens',
};

/**
 * Redirecionamento de tabelas CME: quando uma tabela deve exibir os instrumentos de outra.
 */
const TABELA_REDIRECT_CME: Record<string, string> = {
};

/**
 * Tabelas CME expandidas: cada item da tabela aparece como card individual na página CME.
 */
const TABELAS_CME_EXPANDIDAS = ['equipamentos_cme'];

/** Resolve o redirect se existir, senão retorna o nome original.
 *  Também resolve padrão expandido: "tabela__id" → "tabela" */
export function resolverRedirectTabela(nomeTabela: string): string {
  // Resolver padrão expandido primeiro
  const matchExpandido = nomeTabela.match(/^(.+)__(\d+)$/);
  if (matchExpandido) {
    return matchExpandido[1];
  }
  return TABELA_REDIRECT_CME[nomeTabela] || nomeTabela;
}

/**
 * Tabelas de imagens que usam produto_nome em vez de produto_id
 */
const TABELAS_COM_PRODUTO_NOME = [
  'caixa_de_apoio_alif_imagens',
  'caixa_de_apoio_cervical_imagens',
  'caixa_razek_interlaminar_transforaminal_imagens',
  'caixa_endoline_interlaminar_imagens',
  'caixa_instrucao_biportal_ube_imagens',
];

/**
 * Tabelas com estrutura especial (nome, url_imagem, produto_slug)
 * Diferente do padrão (produto_id/produto_nome, url, principal)
 */
const TABELAS_ESTRUTURA_ESPECIAL_API: Record<string, {
  campoUrl: string;           // Campo que contém a URL da imagem
  produtoSlugPrincipal?: string;  // Produto slug para usar como imagem do card principal
  imagemCardFixa?: string;    // URL fixa para o card principal (quando a busca dinâmica não funciona)
}> = {
  'caixa_de_apoio_lombar_imagens': {
    campoUrl: 'url_imagem',
    produtoSlugPrincipal: 'lamina-afastador-cloward-lombar',
    imagemCardFixa: 'https://lrasuvrzyzmmjumxrhzv.supabase.co/storage/v1/object/public/instrumentos/caixa-de-apoio-lombar/caixa-apoio-lombar/01.jpg',
  },
};

/**
 * Conta itens únicos em uma tabela (sem duplicados)
 * @param nomeTabela - Nome da tabela no Supabase
 * @returns Número de itens únicos
 */
async function contarItensUnicos(nomeTabela: string): Promise<number> {
  const tabelaReal = resolverRedirectTabela(nomeTabela);
  try {
    // Buscar todos os dados da tabela (select * para garantir que pegamos todas as colunas)
    const { data, error } = await supabase
      .from(tabelaReal)
      .select('*');

    if (error || !data || data.length === 0) {
      console.log(`[contarItensUnicos] Erro ou sem dados em "${nomeTabela}":`, error?.message);
      return 0;
    }

    console.log(`[contarItensUnicos] Tabela "${nomeTabela}" tem ${data.length} registros brutos`);

    // Normalizar e contar únicos baseado no campo 'nome' (excluindo ocultos)
    const nomesUnicos = new Set<string>();
    data.forEach((item: any) => {
      // Tentar pegar o nome de diferentes campos possíveis
      const nome = item.nome || item.name || item.titulo || item.title;
      if (nome) {
        // Excluir produtos ocultos da contagem (usar tabelaReal para redirect)
        if (produtoDeveSerOcultoDaTabela(nome, tabelaReal)) return;
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
 * Busca a segunda imagem de uma caixa a partir da tabela de imagens
 * Usa a segunda imagem (ordem=2) para exibir no card da listagem
 * @param nomeTabela - Nome da tabela de produtos
 * @returns URL da segunda imagem ou null
 */
// Produto preferido para imagem do card principal (produto_id cujo imagem deve representar a caixa)
const PRODUTO_ID_CARD_PRINCIPAL: Record<string, number> = {
  'caixa intrumentacao cirurgica cranio': 1, // Caixa de Apoio para Crânio
  'caixa cervical translucente': 58, // Acomodação Kit Translucent
};

// Produto preferido por nome (para tabelas que usam produto_nome em vez de produto_id)
const PRODUTO_NOME_CARD_PRINCIPAL: Record<string, string> = {
  'caixa de apoio alif': 'AFASTADOR DOYEN',
};

// Renomear produtos no frontend (sem alterar o Supabase)
const RENOMEAR_PRODUTO: Record<string, string> = {
  'AFASTADOR DOYEN 45 X 120MM': 'CAIXA DE APOIO ALIF',
};

// Sobrescrever descrição de produtos no frontend (sem alterar o Supabase)
// Chave: nome exato do produto, Valor: descrição customizada
const DESCRICAO_CUSTOMIZADA: Record<string, string> = {
  'Afastador Tubular Vertebral Crystal Lux Safira': 'O Crystal Lux é um kit de cânulas dilatadoras desenvolvido pela Pense Med para procedimentos neurocirúrgicos minimamente invasivos que exigem máxima precisão e segurança.\nProjetado para atender às exigências rigorosas dos neurocirurgiões, o sistema oferece acesso controlado a áreas de alta complexidade anatômica, contribuindo para menor trauma tecidual e melhor visualização do campo cirúrgico.\nSeu design foi pensado para proporcionar dilatação progressiva e estável, permitindo ao cirurgião trabalhar com maior controle em abordagens delicadas, como em cirurgias de coluna e crânio, onde a preservação de estruturas neurais é fundamental.\nO conjunto de cânulas apresenta superfícies cuidadosamente acabadas e geometrias que favorecem a introdução suave, reduzindo o risco de lesões e facilitando o manuseio intraoperatório.\nIdeal para centros de referência em neurocirurgia, o Crystal Lux se posiciona como uma solução de alta performance para desafios anatômicos complexos, alinhando inovação, precisão e confiabilidade. Indicado para profissionais que buscam um kit completo de dilatação com padrão elevado de qualidade, o produto reforça o compromisso da Pense Med em oferecer tecnologias avançadas para resultados cirúrgicos excepcionais.',
};

async function buscarImagemDaCaixa(nomeTabela: string): Promise<string | null> {
  try {
    // Verificar se existe tabela de imagens mapeada
    const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];
    if (!tabelaImagens) {
      console.log(`[buscarImagemDaCaixa] Sem tabela de imagens para "${nomeTabela}"`);
      return null;
    }

    // Verificar se a tabela tem estrutura especial
    const estruturaEspecial = TABELAS_ESTRUTURA_ESPECIAL_API[tabelaImagens];

    // Verificar se a tabela usa produto_nome em vez de produto_id
    const usaProdutoNome = TABELAS_COM_PRODUTO_NOME.includes(tabelaImagens);

    console.log(`[buscarImagemDaCaixa] Buscando em tabela: "${tabelaImagens}" (estruturaEspecial: ${!!estruturaEspecial}, usaProdutoNome: ${usaProdutoNome})`);

    // Tratamento especial para tabelas com estrutura diferente
    if (estruturaEspecial) {
      // Se tem URL fixa definida, usar diretamente
      if (estruturaEspecial.imagemCardFixa) {
        console.log(`[buscarImagemDaCaixa] Usando imagem fixa para "${nomeTabela}": ${estruturaEspecial.imagemCardFixa}`);
        return estruturaEspecial.imagemCardFixa;
      }

      const campoUrl = estruturaEspecial.campoUrl;

      // Se tem produto_slug principal definido, buscar especificamente
      if (estruturaEspecial.produtoSlugPrincipal) {
        const { data: imagemPrincipal, error: erroPrincipal } = await supabase
          .from(tabelaImagens)
          .select('*')
          .eq('produto_slug', estruturaEspecial.produtoSlugPrincipal)
          .eq('ordem', 1)
          .limit(1);

        if (!erroPrincipal && imagemPrincipal && imagemPrincipal.length > 0) {
          const registro = imagemPrincipal[0] as unknown as Record<string, unknown>;
          const url = registro[campoUrl] as string | undefined;
          if (url) {
            console.log(`[buscarImagemDaCaixa] Usando imagem principal do produto_slug "${estruturaEspecial.produtoSlugPrincipal}": ${url}`);
            return url;
          }
        }
      }

      // Fallback: buscar qualquer imagem com ordem 1
      const { data: primeiraImagem, error: erroPrimeira } = await supabase
        .from(tabelaImagens)
        .select('*')
        .eq('ordem', 1)
        .limit(1);

      if (!erroPrimeira && primeiraImagem && primeiraImagem.length > 0) {
        const registro = primeiraImagem[0] as unknown as Record<string, unknown>;
        const url = registro[campoUrl] as string | undefined;
        if (url) {
          console.log(`[buscarImagemDaCaixa] Usando primeira imagem (ordem 1): ${url}`);
          return url;
        }
      }

      // Fallback final: buscar qualquer imagem
      const { data: qualquerImagem, error: erroQualquer } = await supabase
        .from(tabelaImagens)
        .select('*')
        .order('ordem', { ascending: true })
        .limit(1);

      if (!erroQualquer && qualquerImagem && qualquerImagem.length > 0) {
        const registro = qualquerImagem[0] as unknown as Record<string, unknown>;
        const url = registro[campoUrl] as string | undefined;
        if (url) {
          console.log(`[buscarImagemDaCaixa] Usando primeira imagem disponível: ${url}`);
          return url;
        }
      }

      console.log(`[buscarImagemDaCaixa] Nenhuma imagem válida em "${tabelaImagens}" (estrutura especial)`);
      return null;
    }

    // Estratégia 0: Buscar imagem do produto preferido para o card
    const produtoIdPreferido = PRODUTO_ID_CARD_PRINCIPAL[nomeTabela];
    if (produtoIdPreferido) {
      const { data: imgPreferida } = await supabase
        .from(tabelaImagens)
        .select('url')
        .eq('produto_id', produtoIdPreferido)
        .order('ordem', { ascending: true })
        .limit(1);
      if (imgPreferida && imgPreferida.length > 0 && imgPreferida[0]?.url) {
        console.log(`[buscarImagemDaCaixa] Usando imagem do produto preferido (id=${produtoIdPreferido}): ${imgPreferida[0].url}`);
        return imgPreferida[0].url;
      }
    }

    // Estratégia 0b: Buscar por produto_nome preferido (tabelas que usam produto_nome)
    const produtoNomePreferido = PRODUTO_NOME_CARD_PRINCIPAL[nomeTabela];
    if (produtoNomePreferido) {
      const { data: imgNome } = await supabase
        .from(tabelaImagens)
        .select('url')
        .ilike('produto_nome', `${produtoNomePreferido}%`)
        .order('ordem', { ascending: true })
        .limit(1);
      if (imgNome && imgNome.length > 0 && imgNome[0]?.url) {
        console.log(`[buscarImagemDaCaixa] Usando imagem do produto preferido (nome="${produtoNomePreferido}"): ${imgNome[0].url}`);
        return imgNome[0].url;
      }
    }

    // Estratégia 1: Buscar imagem marcada como principal
    const { data: imagemPrincipal, error: erroPrincipal } = await supabase
      .from(tabelaImagens)
      .select('url')
      .eq('principal', true)
      .order('ordem', { ascending: true })
      .limit(1);

    if (!erroPrincipal && imagemPrincipal && imagemPrincipal.length > 0 && imagemPrincipal[0]?.url) {
      console.log(`[buscarImagemDaCaixa] Usando imagem principal: ${imagemPrincipal[0].url}`);
      return imagemPrincipal[0].url;
    }

    // Estratégia 2: Buscar primeira imagem ordenada por ordem
    const { data: primeiraImagem, error: erroPrimeira } = await supabase
      .from(tabelaImagens)
      .select('url, ordem')
      .order('ordem', { ascending: true })
      .limit(1);

    if (!erroPrimeira && primeiraImagem && primeiraImagem.length > 0 && primeiraImagem[0]?.url) {
      console.log(`[buscarImagemDaCaixa] Usando primeira imagem por ordem: ${primeiraImagem[0].url}`);
      return primeiraImagem[0].url;
    }

    // Estratégia 3 (fallback): Buscar qualquer imagem
    const { data: imagens, error } = await supabase
      .from(tabelaImagens)
      .select('url')
      .limit(1);

    if (error) {
      console.error(`[buscarImagemDaCaixa] ERRO Supabase em "${tabelaImagens}":`, error.message, error.code);
      return null;
    }

    if (!imagens || imagens.length === 0) {
      console.log(`[buscarImagemDaCaixa] Nenhuma imagem encontrada em "${tabelaImagens}"`);
      return null;
    }

    if (imagens[0]?.url) {
      console.log(`[buscarImagemDaCaixa] URL selecionada: ${imagens[0].url}`);
      return imagens[0].url;
    }

    console.log(`[buscarImagemDaCaixa] Nenhuma imagem válida em "${tabelaImagens}"`);
    return null;
  } catch (error) {
    console.error(`[buscarImagemDaCaixa] Erro para "${nomeTabela}":`, error);
    return null;
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
      const tabelaReal = resolverRedirectTabela(nomeTabela);
      console.log(`[getCaixasCME] Processando tabela: "${nomeTabela}"${tabelaReal !== nomeTabela ? ` (redirect → "${tabelaReal}")` : ''}`);

      try {
        // Primeiro verificar se a tabela existe e tem dados
        const { data: sampleData, error: sampleError } = await supabase
          .from(tabelaReal)
          .select('*')
          .limit(1);

        if (sampleError) {
          console.error(`[getCaixasCME] Erro ao acessar tabela "${tabelaReal}":`, sampleError.message);
          continue;
        }

        if (!sampleData || sampleData.length === 0) {
          console.warn(`[getCaixasCME] Tabela "${tabelaReal}" está vazia, pulando...`);
          continue;
        }

        // Tabela expandida: cada item aparece como card individual
        if (TABELAS_CME_EXPANDIDAS.includes(nomeTabela)) {
          console.log(`[getCaixasCME] Tabela "${nomeTabela}" é expandida, criando cards individuais...`);
          const { data: todosItens } = await supabase.from(tabelaReal).select('*').order('nome', { ascending: true });
          if (!todosItens || todosItens.length === 0) continue;

          const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];
          let imagensPorProduto: Record<number, string> = {};
          if (tabelaImagens) {
            const { data: imgs } = await supabase.from(tabelaImagens).select('produto_id, url, principal');
            if (imgs) {
              for (const img of imgs) {
                if (img.produto_id && img.url && !imagensPorProduto[img.produto_id]) {
                  imagensPorProduto[img.produto_id] = img.url;
                }
              }
            }
          }

          for (const item of todosItens) {
            const itemId = item.id;
            if (!itemId) continue;
            const imgUrl = imagensPorProduto[itemId] || item.imagem_url || item.imagem || null;
            caixas.push({
              nome_tabela: `${nomeTabela}__${itemId}`,
              nome_exibicao: item.nome || tabelaToNomeExibicao(nomeTabela),
              total_instrumentos: 1,
              imagem_url: imgUrl,
              slug: tabelaToSlug(`${nomeTabela}__${itemId}`),
            });
          }

          console.log(`[getCaixasCME] Expandida "${nomeTabela}": ${todosItens.length} cards individuais`);
          continue;
        }

        // Contar itens ÚNICOS (sem duplicados)
        const totalUnicos = await contarItensUnicos(nomeTabela);
        console.log(`[getCaixasCME] Tabela "${nomeTabela}" tem ${totalUnicos} itens únicos`);

        // Buscar imagem da tabela de imagens (1:N) - usa a segunda imagem
        let imagemUrl = await buscarImagemDaCaixa(tabelaReal);

        // Fallback: usar imagem do primeiro produto se não tiver na tabela de imagens
        if (!imagemUrl) {
          const primeiroItem = sampleData[0];
          imagemUrl = primeiroItem?.imagem_url || primeiroItem?.imagem || null;
          if (imagemUrl === 'NULL' || imagemUrl === 'null') {
            imagemUrl = null;
          }
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

    // Ordenar: primeiro caixas com imagem, depois alfabético
    caixas.sort((a, b) => {
      const aTemImagem = !!a.imagem_url;
      const bTemImagem = !!b.imagem_url;

      // Primeiro critério: caixas com imagem vêm primeiro
      if (aTemImagem && !bTemImagem) return -1;
      if (!aTemImagem && bTemImagem) return 1;

      // Segundo critério: ordenação alfabética
      return a.nome_exibicao.localeCompare(b.nome_exibicao, 'pt-BR');
    });

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
  // Detectar padrão expandido: "tabela__id" → buscar apenas o item específico
  const matchExpandido = nomeTabela.match(/^(.+)__(\d+)$/);
  if (matchExpandido) {
    const tabelaBase = matchExpandido[1];
    const itemId = parseInt(matchExpandido[2]);
    console.log(`[getInstrumentosDaTabela] Card expandido: tabela="${tabelaBase}" id=${itemId}`);

    const { data, error } = await supabase.from(tabelaBase).select('*').eq('id', itemId);
    if (error || !data || data.length === 0) {
      return { instrumentos: [], total: 0, pagina: 1, porPagina, totalPaginas: 0 };
    }

    const item = data[0];
    const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[tabelaBase];
    let imagemUrl = item.imagem_url || item.imagem || null;

    // Buscar imagem da tabela de imagens
    if (tabelaImagens && !imagemUrl) {
      const { data: imgData } = await getProductImagesServer(itemId, tabelaBase, item.nome);
      if (imgData && imgData.length > 0) {
        const principal = imgData.find((img: any) => img.principal) || imgData[0];
        if (principal?.url) imagemUrl = principal.url;
      }
    }

    const instrumento = {
      id: item.id,
      nome: item.nome || '',
      codigo: String(item.id),
      descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || null,
      categoria: item.categoria || null,
      imagem_url: imagemUrl,
      imagem: imagemUrl,
    };

    return { instrumentos: [instrumento], total: 1, pagina: 1, porPagina, totalPaginas: 1 };
  }

  // Resolver redirect: se a tabela redireciona para outra, buscar da tabela destino
  const tabelaReal = resolverRedirectTabela(nomeTabela);
  if (tabelaReal !== nomeTabela) {
    console.log(`[getInstrumentosDaTabela] Redirect: "${nomeTabela}" → "${tabelaReal}"`);
  }
  console.log(`[getInstrumentosDaTabela] Iniciando busca em "${tabelaReal}"`);
  console.log(`[getInstrumentosDaTabela] Página: ${pagina}, Por página: ${porPagina}`);

  try {
    // Buscar TODOS os dados primeiro para remover duplicados corretamente
    console.log(`[getInstrumentosDaTabela] Buscando todos os registros...`);
    const { data, error } = await supabase
      .from(tabelaReal)
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
        nome: RENOMEAR_PRODUTO[item.nome] || item.nome,
        nome_original: item.nome,
        codigo,
        imagem_url: imagemUrl,
      };
    }) || [];

    // REMOVER DUPLICADOS antes de paginar
    const instrumentosUnicos = removerDuplicados(instrumentosNormalizados);
    console.log(`[getInstrumentosDaTabela] Após remover duplicados: ${instrumentosUnicos.length}`);

    // FILTRAR produtos ocultos para esta tabela específica
    const instrumentosFiltrados = instrumentosUnicos.filter(
      (item: any) => !produtoDeveSerOcultoDaTabela(item.nome, tabelaReal)
    );
    console.log(`[getInstrumentosDaTabela] Após filtrar ocultos: ${instrumentosFiltrados.length}`);

    // ORDENAR por imagem: produtos com imagem primeiro, depois alfabético
    const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[tabelaReal];
    let instrumentosOrdenados = instrumentosFiltrados;

    if (tabelaImagens) {
      const produtosComImagem = await getProdutosComImagem(tabelaImagens);
      // Verificar se a tabela usa produto_nome
      const usaNome = TABELAS_COM_PRODUTO_NOME.includes(tabelaImagens) ||
                      TABELAS_ESTRUTURA_ESPECIAL_API[tabelaImagens];
      instrumentosOrdenados = ordenarPorImagem(instrumentosFiltrados, produtosComImagem, usaNome ? 'nome' : 'id');
      console.log(`[getInstrumentosDaTabela] Ordenado por imagem: ${produtosComImagem.size} produtos com imagem`);
    }

    // Aplicar paginação nos itens ordenados
    const offset = (pagina - 1) * porPagina;
    const instrumentosPaginados = instrumentosOrdenados.slice(offset, offset + porPagina);

    // Pré-carregar imagens server-side para instrumentos sem imagem_url
    // CRÍTICO: Client-side Supabase falha em produção Vercel
    if (tabelaImagens) {
      let instrImgOk = 0;
      let instrImgFail = 0;
      await Promise.all(instrumentosPaginados.map(async (instr: any) => {
        if (instr.imagem_url) { instrImgOk++; return; }
        try {
          const { data: imgData, error: imgError } = await getProductImagesServer(
            instr.id,
            tabelaReal,
            instr.nome_original || instr.nome,
            instr.imagem_slug || undefined
          );
          if (imgError) {
            console.error(`[getInstrumentosDaTabela] Erro imagem "${instr.nome}":`, imgError);
            instrImgFail++;
          } else if (imgData && imgData.length > 0) {
            const principal = imgData.find(img => img.principal) || imgData[0];
            if (principal?.url) {
              instr.imagem_url = principal.url;
              instrImgOk++;
            } else {
              instrImgFail++;
            }
          } else {
            instrImgFail++;
          }
        } catch (err) {
          console.error(`[getInstrumentosDaTabela] Exceção imagem "${instr.nome}":`, err);
          instrImgFail++;
        }
      }));
      console.log(`[getInstrumentosDaTabela] Imagens: ${instrImgOk} ok, ${instrImgFail} sem imagem`);
    }

    const total = instrumentosFiltrados.length;
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
      nome: RENOMEAR_PRODUTO[data.nome] || data.nome,
      nome_original: data.nome,
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
  'arthrocare quantum 2 rf + pedal',
  'b. braun stimuplex hns12',
  'bomba de artroscopia flosteady 150',
  'gerador de diatermia ellman surgimax 4.0 dual rf 120 ice',
  'gerador de radiofrequencia multigen 4 canais',
  'gerador de rf  para manejo da dor coolief',
  'gerador rf  surgimax plus + pedal',
  'laser lombar delight',
  'stryker 5400-50 core console + pedal',
  'torniquete_eletronico',
  'bisturi_eletronico_wavetronic',
  'equipamentos_medicos',
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
        // Verificar se é tabela expandida (cada item vira um card individual)
        if (TABELAS_EQUIPAMENTOS_EXPANDIDOS.includes(nomeTabela)) {
          console.log(`[getCategoriasEquipamentos] Tabela "${nomeTabela}" é expandida - criando cards individuais`);

          const { data: todosItens, error: erroItens } = await supabase
            .from(nomeTabela)
            .select('*')
            .order('nome', { ascending: true });

          if (erroItens || !todosItens || todosItens.length === 0) {
            console.warn(`[getCategoriasEquipamentos] Tabela expandida "${nomeTabela}" vazia ou com erro`);
            continue;
          }

          // Buscar imagens de todos os produtos desta tabela
          const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];
          let imagensPorProduto: Record<number, string> = {};
          if (tabelaImagens) {
            const { data: imgData } = await supabase
              .from(tabelaImagens)
              .select('produto_id, url, ordem, principal')
              .order('ordem', { ascending: true });

            if (imgData) {
              for (const img of imgData) {
                // Usar a primeira imagem (ou principal) de cada produto
                if (!imagensPorProduto[img.produto_id] || img.principal) {
                  imagensPorProduto[img.produto_id] = img.url;
                }
              }
            }
          }

          for (const item of todosItens) {
            const itemId = item.id;
            if (!itemId) continue;

            // Slug especial: equipamentos_medicos__<id>
            const slugItem = tabelaToSlug(`${nomeTabela}__${itemId}`);
            const imagemUrlRaw = imagensPorProduto[itemId] || item.imagem_url || null;
            const imagemUrl = imagemUrlRaw ? corrigirUrlImagem(imagemUrlRaw) : null;

            const categoria: CategoriaEquipamento = {
              nome_tabela: nomeTabela,
              nome_exibicao: item.nome,
              total_itens: 1,
              imagem_url: imagemUrl,
              slug: slugItem,
            };

            categorias.push(categoria);
            console.log(`[getCategoriasEquipamentos] Card expandido: "${item.nome}" (ID: ${itemId})`);
          }

          continue;
        }

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
        // Para produtos únicos (ex: Arthrocare), a contagem é sempre 1
        const isProdutoUnico = isEquipamentoProdutoUnico(nomeTabela);
        const totalUnicos = isProdutoUnico ? 1 : await contarItensUnicos(nomeTabela);
        console.log(`[getCategoriasEquipamentos] Tabela "${nomeTabela}" tem ${totalUnicos} itens únicos${isProdutoUnico ? ' (produto único)' : ''}`);

        // Buscar imagem da tabela de imagens (1:N)
        let imagemUrl = await buscarImagemDaCaixa(nomeTabela);

        // Fallback: usar imagem do primeiro produto se não tiver na tabela de imagens
        if (!imagemUrl) {
          const primeiroItem = sampleData[0];
          imagemUrl = primeiroItem?.imagem_url || primeiroItem?.imagem || null;
          if (imagemUrl === 'NULL' || imagemUrl === 'null') {
            imagemUrl = null;
          }
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

    // Ordenar: primeiro categorias com imagem, depois alfabético
    categorias.sort((a, b) => {
      const aTemImagem = !!a.imagem_url;
      const bTemImagem = !!b.imagem_url;

      // Primeiro critério: categorias com imagem vêm primeiro
      if (aTemImagem && !bTemImagem) return -1;
      if (!aTemImagem && bTemImagem) return 1;

      // Segundo critério: ordenação alfabética
      return a.nome_exibicao.localeCompare(b.nome_exibicao, 'pt-BR');
    });

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
        descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || null,
        imagem_url: imagemUrl,
      };
    }) || [];

    // REMOVER DUPLICADOS antes de paginar
    const equipamentosUnicos = removerDuplicados(equipamentosNormalizados);
    console.log(`[getEquipamentosDaTabela] Após remover duplicados: ${equipamentosUnicos.length}`);

    // ORDENAR por imagem: produtos com imagem primeiro, depois alfabético
    const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];
    let equipamentosOrdenados = equipamentosUnicos;

    if (tabelaImagens) {
      const produtosComImagem = await getProdutosComImagem(tabelaImagens);
      equipamentosOrdenados = ordenarPorImagem(equipamentosUnicos, produtosComImagem, 'id');
      console.log(`[getEquipamentosDaTabela] Ordenado por imagem: ${produtosComImagem.size} produtos com imagem`);
    }

    // Aplicar paginação nos itens ordenados
    const offset = (pagina - 1) * porPagina;
    const equipamentosPaginados = equipamentosOrdenados.slice(offset, offset + porPagina);

    // Pré-carregar imagens server-side para equipamentos sem imagem_url
    // CRÍTICO: Client-side Supabase falha em produção Vercel
    if (tabelaImagens) {
      let equipImgOk = 0;
      let equipImgFail = 0;
      await Promise.all(equipamentosPaginados.map(async (equip) => {
        if (equip.imagem_url) { equipImgOk++; return; }
        try {
          const { data: imgData, error: imgError } = await getProductImagesServer(equip.id, nomeTabela, equip.nome);
          if (imgError) {
            console.error(`[getEquipamentosDaTabela] Erro imagem "${equip.nome}":`, imgError);
            equipImgFail++;
          } else if (imgData && imgData.length > 0) {
            const principal = imgData.find(img => img.principal) || imgData[0];
            if (principal?.url) {
              equip.imagem_url = principal.url;
              equipImgOk++;
            } else {
              equipImgFail++;
            }
          } else {
            equipImgFail++;
          }
        } catch (err) {
          console.error(`[getEquipamentosDaTabela] Exceção imagem "${equip.nome}":`, err);
          equipImgFail++;
        }
      }));
      console.log(`[getEquipamentosDaTabela] Imagens: ${equipImgOk} ok, ${equipImgFail} sem imagem`);
    }

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
    console.log(`[getEquipamentoPorId] Buscando ID ${id} em "${nomeTabela}"`);

    let data: any = null;
    let error: any = null;
    let idUsado: number = id;

    // Primeiro tentar buscar por coluna 'id'
    const resultado = await supabase
      .from(nomeTabela)
      .select('*')
      .eq('id', id)
      .single();

    data = resultado.data;
    error = resultado.error;

    if (error) {
      console.log(`[getEquipamentoPorId] Erro ao buscar por ID: ${error.message} (code: ${error.code})`);

      // Se a tabela não tem coluna 'id' (erro 42703) ou não encontrou registro (PGRST116), buscar todos e usar índice
      if (error.code === '42703' || error.code === 'PGRST116') {
        console.log(`[getEquipamentoPorId] Tabela não tem coluna id ou não encontrou, buscando por índice...`);
        const { data: allData, error: allError } = await supabase
          .from(nomeTabela)
          .select('*')
          .order('nome', { ascending: true });

        if (!allError && allData) {
          const idxBuscado = id - 1; // ID começa em 1, índice em 0
          if (idxBuscado >= 0 && idxBuscado < allData.length) {
            data = allData[idxBuscado];
            error = null;
            idUsado = id;
            console.log(`[getEquipamentoPorId] Encontrado por índice: ${id} -> "${data?.nome}"`);
          }
        }
      }
    }

    if (error || !data) {
      console.log(`[getEquipamentoPorId] Equipamento não encontrado`);
      return null;
    }

    let imagemUrl = data.imagem_url || data.imagem || null;
    if (imagemUrl === 'NULL' || imagemUrl === 'null') {
      imagemUrl = null;
    }

    return {
      id: idUsado,
      nome: data.nome,
      categoria: data.categoria,
      codigo: data.codigo || null,
      descricao: (data.nome && DESCRICAO_CUSTOMIZADA[data.nome]) || data.descricao || null,
      imagem_url: imagemUrl,
    };
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
  categoria_principal: 'Instrumentação Cirúrgica CME' | 'Equipamentos Médicos' | 'OPME';
  caixa_tabela: string;
  caixa_nome: string;
  caixa_slug: string;
  nome_original?: string;
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

  const todosProdutos: (ProdutoCatalogo & { temImagemNaTabela?: boolean })[] = [];
  const contagemCategorias: Map<string, number> = new Map();
  const contagemCaixas: Map<string, { nome: string; slug: string; categoria: string; total: number }> = new Map();

  // Cache de produtos com imagem por tabela (para evitar múltiplas queries)
  const cacheImagensPorTabela: Map<string, Set<string | number>> = new Map();

  try {
    // Buscar de todas as tabelas CME
    for (const nomeTabela of TABELAS_CME) {
      try {
        // IMPORTANTE: Ordenar por nome para manter consistência com busca por índice
        const { data, error } = await supabase
          .from(nomeTabela)
          .select('*')
          .order('nome', { ascending: true });

        // Buscar quais produtos têm imagem nesta tabela
        const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];
        let produtosComImagem: Set<string | number> = new Set();
        if (tabelaImagens && !cacheImagensPorTabela.has(tabelaImagens)) {
          produtosComImagem = await getProdutosComImagem(tabelaImagens);
          cacheImagensPorTabela.set(tabelaImagens, produtosComImagem);
        } else if (tabelaImagens) {
          produtosComImagem = cacheImagensPorTabela.get(tabelaImagens) || new Set();
        }

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

        // Determinar como verificar se produto tem imagem
        const usaNomeCME = TABELAS_COM_PRODUTO_NOME.includes(tabelaImagens || '') ||
                          TABELAS_ESTRUTURA_ESPECIAL_API[tabelaImagens || ''];

        let produtosAdicionados = 0;
        data.forEach((item: any, index: number) => {
          // Verificar se o produto deve ser ocultado desta tabela específica
          if (produtoDeveSerOcultoDaTabela(item.nome || '', nomeTabela)) {
            console.log(`[getTodosProdutosCatalogo] Produto oculto: "${item.nome}" da tabela "${nomeTabela}"`);
            return; // Pular este produto
          }

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

          // Verificar se o produto tem imagem na tabela de imagens
          const produtoId = item.id ?? (index + 1);
          let temImagemNaTabela = false;
          if (usaNomeCME) {
            temImagemNaTabela = produtosComImagem.has(item.nome) ||
                               produtosComImagem.has(item.nome?.toLowerCase());
          } else {
            temImagemNaTabela = produtosComImagem.has(produtoId);
          }

          const nomeExibicao = RENOMEAR_PRODUTO[item.nome] || item.nome;
          const nomeOriginal = RENOMEAR_PRODUTO[item.nome] ? item.nome : undefined;

          todosProdutos.push({
            // IMPORTANTE: Se item.id não existe, usar index + 1 (1-based) para compatibilidade com busca
            id: `cme-${nomeTabela}-${produtoId}`,
            nome: nomeExibicao,
            nome_original: nomeOriginal,
            codigo,
            descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || null,
            imagem_url: imagemUrl,
            categoria_principal: 'Instrumentação Cirúrgica CME',
            caixa_tabela: nomeTabela,
            caixa_nome: caixaNome,
            caixa_slug: caixaSlugAtual,
            temImagemNaTabela,
          });
          produtosAdicionados++;
        });

        // Atualizar contagem (apenas produtos não-ocultos)
        const totalCaixa = contagemCaixas.get(caixaSlugAtual)?.total || 0;
        contagemCaixas.set(caixaSlugAtual, {
          nome: caixaNome,
          slug: caixaSlugAtual,
          categoria: 'Instrumentação Cirúrgica CME',
          total: totalCaixa + produtosAdicionados,
        });
      } catch (err) {
        console.error(`[getTodosProdutosCatalogo] Erro em tabela CME "${nomeTabela}":`, err);
      }
    }

    // Buscar de todas as tabelas de Equipamentos
    for (const nomeTabela of TABELAS_EQUIPAMENTOS) {
      try {
        const caixaNome = tabelaToNomeExibicao(nomeTabela);
        const caixaSlugAtual = tabelaToSlug(nomeTabela);

        // Se é tabela expandida, cada item vira um card individual no catálogo
        if (isEquipamentoExpandido(nomeTabela)) {
          console.log(`[getTodosProdutosCatalogo] Tabela Equip "${nomeTabela}": expandida`);

          const { data: itensExpandidos, error: erroExpand } = await supabase
            .from(nomeTabela)
            .select('*')
            .order('nome', { ascending: true });

          if (erroExpand || !itensExpandidos || itensExpandidos.length === 0) {
            console.warn(`[getTodosProdutosCatalogo] Tabela expandida "${nomeTabela}" vazia ou com erro`);
            continue;
          }

          // Buscar imagens de todos os produtos desta tabela
          const tabelaImgExpand = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];
          let imagensPorProduto: Record<number, string> = {};
          if (tabelaImgExpand) {
            try {
              const { data: imgData } = await supabase
                .from(tabelaImgExpand)
                .select('produto_id, url, ordem, principal')
                .order('ordem', { ascending: true });

              if (imgData) {
                for (const img of imgData) {
                  if (!(img.produto_id in imagensPorProduto) || img.principal) {
                    imagensPorProduto[img.produto_id] = img.url;
                  }
                }
              }
            } catch {
              // Ignorar erro de tabela de imagens
            }
          }

          for (const item of itensExpandidos) {
            const itemId = item.id;
            if (!itemId) continue;

            const slugExpandido = tabelaToSlug(`${nomeTabela}__${itemId}`);
            const imagemUrlRaw2 = imagensPorProduto[itemId] || item.imagem_url || null;
            const imagemUrl = imagemUrlRaw2 ? corrigirUrlImagem(imagemUrlRaw2) : null;

            todosProdutos.push({
              id: `equip-${nomeTabela}-${itemId}`,
              nome: item.nome,
              codigo: String(itemId),
              descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || null,
              imagem_url: imagemUrl,
              categoria_principal: 'Equipamentos Médicos',
              caixa_tabela: nomeTabela,
              caixa_nome: item.nome,
              caixa_slug: slugExpandido,
              temImagemNaTabela: !!imagemUrl,
            });
          }

          // Contagem para filtro lateral
          for (const item of itensExpandidos) {
            if (!item.id) continue;
            const slugItem = tabelaToSlug(`${nomeTabela}__${item.id}`);
            contagemCaixas.set(slugItem, {
              nome: item.nome,
              slug: slugItem,
              categoria: 'Equipamentos Médicos',
              total: 1,
            });
          }

          continue;
        }

        // Se é produto único, adicionar apenas 1 item representando a categoria
        if (isEquipamentoProdutoUnico(nomeTabela)) {
          console.log(`[getTodosProdutosCatalogo] Tabela Equip "${nomeTabela}": produto único`);

          // Buscar imagem da tabela de imagens
          let imagemUrl: string | null = null;
          const tabelaImagens = nomeTabela.replace(/ /g, '_').replace(/\+/g, '').replace(/\./g, '').toLowerCase() + '_imagens';
          try {
            const { data: imagemData } = await supabase
              .from(tabelaImagens.replace(/__/g, '_'))
              .select('url')
              .eq('ordem', 1)
              .limit(1);
            if (imagemData && imagemData.length > 0) {
              imagemUrl = imagemData[0].url;
            }
          } catch {
            // Ignorar erro de tabela de imagens
          }

          todosProdutos.push({
            id: `equip-${nomeTabela}-1`,
            nome: caixaNome,
            codigo: '1',
            descricao: `${caixaNome} - Equipamento médico de alta tecnologia disponível para locação.`,
            imagem_url: imagemUrl,
            categoria_principal: 'Equipamentos Médicos',
            caixa_tabela: nomeTabela,
            caixa_nome: caixaNome,
            caixa_slug: caixaSlugAtual,
            temImagemNaTabela: !!imagemUrl,
          });

          // Contagem = 1 para produto único
          contagemCaixas.set(caixaSlugAtual, {
            nome: caixaNome,
            slug: caixaSlugAtual,
            categoria: 'Equipamentos Médicos',
            total: 1,
          });
          continue;
        }

        // IMPORTANTE: Ordenar por nome para manter consistência com busca por índice
        const { data, error } = await supabase
          .from(nomeTabela)
          .select('*')
          .order('nome', { ascending: true });

        // Buscar quais equipamentos têm imagem nesta tabela
        const tabelaImagensEquip = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];
        let equipComImagem: Set<string | number> = new Set();
        if (tabelaImagensEquip && !cacheImagensPorTabela.has(tabelaImagensEquip)) {
          equipComImagem = await getProdutosComImagem(tabelaImagensEquip);
          cacheImagensPorTabela.set(tabelaImagensEquip, equipComImagem);
        } else if (tabelaImagensEquip) {
          equipComImagem = cacheImagensPorTabela.get(tabelaImagensEquip) || new Set();
        }

        if (error) {
          console.warn(`[getTodosProdutosCatalogo] Tabela Equip "${nomeTabela}" erro:`, error.message);
          continue;
        }
        if (!data || data.length === 0) {
          console.log(`[getTodosProdutosCatalogo] Tabela Equip "${nomeTabela}": ${data?.length || 0} itens`);
          continue;
        }

        console.log(`[getTodosProdutosCatalogo] Tabela Equip "${nomeTabela}": ${data.length} itens`);

        // Determinar como verificar se equipamento tem imagem
        const usaNomeEquip = TABELAS_COM_PRODUTO_NOME.includes(tabelaImagensEquip || '') ||
                            TABELAS_ESTRUTURA_ESPECIAL_API[tabelaImagensEquip || ''];

        let equipAdicionados = 0;
        data.forEach((item: any, index: number) => {
          // Verificar se o equipamento deve ser ocultado desta tabela específica
          if (produtoDeveSerOcultoDaTabela(item.nome || '', nomeTabela)) {
            console.log(`[getTodosProdutosCatalogo] Equipamento oculto: "${item.nome}" da tabela "${nomeTabela}"`);
            return; // Pular este equipamento
          }

          let imagemUrl = item.imagem_url || item.imagem || null;
          if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

          // Gerar código/ID para equipamentos
          // IMPORTANTE: Se item.id não existe, usar index + 1 (1-based) para compatibilidade com busca
          const produtoIdEquip = item.id ?? (index + 1);
          let idEquipamento = String(produtoIdEquip);

          // Verificar se o equipamento tem imagem na tabela de imagens
          let temImagemNaTabela = false;
          if (usaNomeEquip) {
            temImagemNaTabela = equipComImagem.has(item.nome) ||
                               equipComImagem.has(item.nome?.toLowerCase());
          } else {
            temImagemNaTabela = equipComImagem.has(produtoIdEquip);
          }

          todosProdutos.push({
            id: `equip-${nomeTabela}-${produtoIdEquip}`,
            nome: item.nome,
            codigo: idEquipamento,
            descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || null,
            imagem_url: imagemUrl,
            categoria_principal: 'Equipamentos Médicos',
            caixa_tabela: nomeTabela,
            caixa_nome: caixaNome,
            caixa_slug: caixaSlugAtual,
            temImagemNaTabela,
          });
          equipAdicionados++;
        });

        // Atualizar contagem (apenas equipamentos não-ocultos)
        const totalCaixa = contagemCaixas.get(caixaSlugAtual)?.total || 0;
        contagemCaixas.set(caixaSlugAtual, {
          nome: caixaNome,
          slug: caixaSlugAtual,
          categoria: 'Equipamentos Médicos',
          total: totalCaixa + equipAdicionados,
        });
      } catch (err) {
        console.error(`[getTodosProdutosCatalogo] Erro em tabela Equip "${nomeTabela}":`, err);
      }
    }

    // Buscar produtos OPME
    try {
      const { data, error } = await supabase
        .from('produtos_opme')
        .select('*');

      // Buscar quais produtos OPME têm imagem
      let opmeComImagem: Set<string | number> = new Set();
      if (!cacheImagensPorTabela.has('produtos_opme_imagens')) {
        // Buscar produto_id dos produtos que têm imagem
        const { data: imagensOPME } = await supabase
          .from('produtos_opme_imagens')
          .select('produto_id');
        if (imagensOPME) {
          imagensOPME.forEach((img: any) => {
            if (img.produto_id) opmeComImagem.add(img.produto_id);
          });
        }
        cacheImagensPorTabela.set('produtos_opme_imagens', opmeComImagem);
      } else {
        opmeComImagem = cacheImagensPorTabela.get('produtos_opme_imagens') || new Set();
      }

      if (error) {
        console.warn(`[getTodosProdutosCatalogo] Tabela OPME erro:`, error.message);
      } else if (data && data.length > 0) {
        // Filtrar produtos OPME ocultos
        const dataFiltrada = data.filter((item: any) => !produtoOPMEDeveSerOculto(item.id));
        console.log(`[getTodosProdutosCatalogo] Tabela OPME: ${dataFiltrada.length} itens (${data.length - dataFiltrada.length} ocultos)`);

        dataFiltrada.forEach((item: any, index: number) => {
          const produtoIdOPME = item.id || index;
          const temImagemNaTabela = opmeComImagem.has(produtoIdOPME);

          const produtoCatalogo: ProdutoCatalogo & { temImagemNaTabela?: boolean } = {
            id: `opme-${produtoIdOPME}`,
            nome: item.nome || 'Produto OPME',
            codigo: item.registro_anvisa || null,
            descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || item.aplicacao || null,
            imagem_url: item.imagem_url || null,
            categoria_principal: 'OPME',
            caixa_tabela: 'produtos_opme',
            caixa_nome: item.categoria || 'OPME',
            caixa_slug: 'opme',
            temImagemNaTabela,
          };
          todosProdutos.push(produtoCatalogo);
        });

        // Contagem de categoria OPME (apenas produtos não ocultos)
        const countOPME = contagemCategorias.get('OPME') || 0;
        contagemCategorias.set('OPME', countOPME + dataFiltrada.length);

        // Contagem de caixas/categorias OPME (apenas produtos não ocultos)
        dataFiltrada.forEach((item: any) => {
          const categoriaOPME = item.categoria || 'OPME';
          const slugCategoria = tabelaToSlug(categoriaOPME);
          const caixaExistente = contagemCaixas.get(slugCategoria);
          if (caixaExistente) {
            caixaExistente.total += 1;
          } else {
            contagemCaixas.set(slugCategoria, {
              nome: categoriaOPME,
              slug: slugCategoria,
              categoria: 'OPME',
              total: 1,
            });
          }
        });
      } else {
        console.log(`[getTodosProdutosCatalogo] Tabela OPME: 0 itens`);
      }
    } catch (err) {
      console.error(`[getTodosProdutosCatalogo] Erro em tabela OPME:`, err);
    }

    // Buscar produtos OPME de tabelas adicionais
    const TABELAS_OPME_EXTRAS = ['kit_cirurgico_easycore_hip', 'kit-brocas-diamantadas-biometal'];
    for (const tabelaOPME of TABELAS_OPME_EXTRAS) {
      try {
        const { data, error } = await supabase.from(tabelaOPME).select('*').order('nome', { ascending: true });
        if (error || !data || data.length === 0) continue;

        const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[tabelaOPME];
        let opmeExtraComImagem: Set<string | number> = new Set();
        if (tabelaImagens) {
          opmeExtraComImagem = await getProdutosComImagem(tabelaImagens);
        }

        const caixaNome = tabelaToNomeExibicao(tabelaOPME);
        const caixaSlugAtual = tabelaToSlug(tabelaOPME);

        data.forEach((item: any, index: number) => {
          const produtoId = item.id || (index + 1);
          const temImagemNaTabela = opmeExtraComImagem.has(produtoId);
          todosProdutos.push({
            id: `opme-${tabelaOPME}-${produtoId}`,
            nome: item.nome || caixaNome,
            codigo: item.codigo || null,
            descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || null,
            imagem_url: item.imagem_url || null,
            categoria_principal: 'OPME',
            caixa_tabela: tabelaOPME,
            caixa_nome: caixaNome,
            caixa_slug: caixaSlugAtual,
            temImagemNaTabela,
          });
        });

        const countOPME = contagemCategorias.get('OPME') || 0;
        contagemCategorias.set('OPME', countOPME + data.length);
        console.log(`[getTodosProdutosCatalogo] Tabela OPME extra "${tabelaOPME}": ${data.length} itens`);
      } catch (err) {
        console.error(`[getTodosProdutosCatalogo] Erro OPME extra "${tabelaOPME}":`, err);
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

    // Filtro de busca avançado - procura em todos os campos com tolerância a erros
    if (busca) {
      // Função para normalizar texto (remove acentos, caracteres especiais, múltiplos espaços)
      const normalizarParaBusca = (texto: string): string => {
        return texto
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // remove acentos
          .replace(/[\/\-_.,:;()[\]{}'"]/g, ' ') // substitui caracteres especiais por espaço
          .replace(/\s+/g, ' ') // normaliza múltiplos espaços
          .trim();
      };

      const buscaNormalizada = normalizarParaBusca(busca);
      const palavrasBusca = buscaNormalizada.split(' ').filter(p => p.length > 1); // ignora palavras com 1 caractere

      produtosFiltrados = produtosFiltrados.filter(p => {
        // Criar texto completo para busca
        const textoCompleto = normalizarParaBusca([
          p.nome,
          p.descricao,
          p.codigo,
          p.caixa_nome,
          p.categoria_principal
        ].filter(Boolean).join(' '));

        // Se busca tem só uma palavra, basta conter
        if (palavrasBusca.length === 1) {
          return textoCompleto.includes(palavrasBusca[0]);
        }

        // Para múltiplas palavras: pelo menos 70% das palavras devem estar presentes
        // OU o termo de busca completo está no texto
        if (textoCompleto.includes(buscaNormalizada)) {
          return true;
        }

        const palavrasEncontradas = palavrasBusca.filter(palavra => textoCompleto.includes(palavra));
        const percentualEncontrado = palavrasEncontradas.length / palavrasBusca.length;

        // Aceita se encontrou pelo menos 70% das palavras (permite erros/omissões)
        return percentualEncontrado >= 0.7;
      });

      // Ordenar por relevância quando há busca
      produtosFiltrados.sort((a, b) => {
        const nomeA = normalizarParaBusca(a.nome || '');
        const nomeB = normalizarParaBusca(b.nome || '');

        // Prioridade 1: Nome começa com o termo de busca
        const aComeca = nomeA.startsWith(buscaNormalizada) ? 1 : 0;
        const bComeca = nomeB.startsWith(buscaNormalizada) ? 1 : 0;
        if (aComeca !== bComeca) return bComeca - aComeca;

        // Prioridade 2: Nome contém o termo exato
        const aContemExato = nomeA.includes(buscaNormalizada) ? 1 : 0;
        const bContemExato = nomeB.includes(buscaNormalizada) ? 1 : 0;
        if (aContemExato !== bContemExato) return bContemExato - aContemExato;

        // Prioridade 3: Código igual ao termo
        const codigoA = normalizarParaBusca(a.codigo || '');
        const codigoB = normalizarParaBusca(b.codigo || '');
        if (codigoA === buscaNormalizada) return -1;
        if (codigoB === buscaNormalizada) return 1;

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

    // Ordenação: priorizar produtos com imagem, depois ordenar conforme solicitado
    produtosFiltrados.sort((a, b) => {
      // Primeiro critério: produtos com imagem vêm primeiro (exceto quando há busca)
      // Usar temImagemNaTabela que verifica na tabela de imagens real
      if (!busca) {
        const aTemImagem = !!(a as any).temImagemNaTabela;
        const bTemImagem = !!(b as any).temImagemNaTabela;
        if (aTemImagem && !bTemImagem) return -1;
        if (!aTemImagem && bTemImagem) return 1;
      }

      // Segundo critério: ordenação conforme solicitado
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

    // Pré-carregar imagens server-side para produtos da página que não têm imagem_url
    // CRÍTICO: Client-side Supabase falha em produção Vercel, então DEVE ser server-side
    let imgCarregadas = 0;
    let imgFalharam = 0;
    await Promise.all(produtosPaginados.map(async (produto) => {
      if (produto.imagem_url) {
        imgCarregadas++;
        return;
      }

      try {
        // Extrair o ID numérico do id composto (formato: "tipo-nomeTabela-ID")
        const partes = produto.id.split('-');
        const idString = partes[partes.length - 1];
        const prodId = /^\d+$/.test(idString) ? parseInt(idString, 10) : null;

        if (!prodId) {
          console.warn(`[getTodosProdutosCatalogo] ID não numérico para "${produto.nome}": ${produto.id}`);
          imgFalharam++;
          return;
        }

        // Para OPME da tabela principal, buscar direto
        if (produto.categoria_principal === 'OPME' && produto.caixa_tabela === 'produtos_opme') {
          const { data: opmeImgs, error: opmeErr } = await supabase
            .from('produtos_opme_imagens')
            .select('url, ordem')
            .eq('produto_id', prodId)
            .order('ordem', { ascending: true })
            .limit(1);

          if (opmeErr) {
            console.error(`[getTodosProdutosCatalogo] Erro OPME imagem produto ${prodId}:`, opmeErr.message);
            imgFalharam++;
          } else if (opmeImgs && opmeImgs.length > 0) {
            produto.imagem_url = opmeImgs[0].url;
            imgCarregadas++;
          } else {
            imgFalharam++;
          }
          return;
        }

        // Para CME e Equipamentos, usar getProductImagesServer
        const { data: imgData, error: imgError } = await getProductImagesServer(prodId, produto.caixa_tabela, produto.nome_original || produto.nome);
        if (imgError) {
          console.error(`[getTodosProdutosCatalogo] Erro imagem "${produto.nome}" (tabela: ${produto.caixa_tabela}):`, imgError);
          imgFalharam++;
        } else if (imgData && imgData.length > 0) {
          const principal = imgData.find(img => img.principal) || imgData[0];
          if (principal?.url) {
            produto.imagem_url = principal.url;
            imgCarregadas++;
          } else {
            imgFalharam++;
          }
        } else {
          imgFalharam++;
        }
      } catch (err) {
        console.error(`[getTodosProdutosCatalogo] Exceção ao buscar imagem de "${produto.nome}":`, err);
        imgFalharam++;
      }
    }));

    console.log(`[getTodosProdutosCatalogo] Imagens: ${imgCarregadas} carregadas, ${imgFalharam} sem imagem (de ${produtosPaginados.length} produtos)`);

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
  nome_original?: string;
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
  const isExpandida = isEquipamentoExpandido(nomeTabela);

  try {
    // 1. Buscar outros produtos da MESMA CAIXA (mais relevante)
    // Se a tabela atual é de produto único, pular esta etapa (não mostrar itens internos)
    if (!isEquipamentoProdutoUnico(nomeTabela)) {
      // IMPORTANTE: Ordenar por nome para consistência com busca por índice
      const { data: mesmaCaixa, error: erroMesmaCaixa } = await supabase
        .from(nomeTabela)
        .select('*')
        .order('nome', { ascending: true })
        .limit(limite + 1); // +1 para compensar se o atual estiver incluído

      // Pré-carregar imagens para tabela expandida (imagem_url é null na tabela principal)
      let imagensPorProduto: Record<number, string> = {};
      if (isExpandida) {
        const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];
        if (tabelaImagens) {
          const { data: imgData } = await supabase
            .from(tabelaImagens)
            .select('produto_id, url, ordem, principal')
            .order('ordem', { ascending: true });
          if (imgData) {
            for (const img of imgData) {
              if (!imagensPorProduto[img.produto_id] || img.principal) {
                imagensPorProduto[img.produto_id] = img.url;
              }
            }
          }
        }
      }

      if (!erroMesmaCaixa && mesmaCaixa) {
        mesmaCaixa.forEach((item: any, index: number) => {
          // Excluir o produto atual
          // IMPORTANTE: Se item.id não existe, usar index + 1 (1-based) para consistência
          const itemId = item.id ?? (index + 1);
          if (String(itemId) === String(produtoAtualId)) return;
          if (relacionados.length >= limite) return;

          // Verificar se o produto deve ser oculto
          if (produtoDeveSerOcultoDaTabela(item.nome || '', nomeTabela)) return;

          // Para tabelas expandidas, buscar imagem da tabela de imagens
          let imagemUrl = item.imagem_url || item.imagem || null;
          if (isExpandida && imagensPorProduto[itemId]) {
            imagemUrl = corrigirUrlImagem(imagensPorProduto[itemId]);
          }
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

          // Para tabelas expandidas, usar slug com __id
          const itemCaixaSlug = isExpandida ? tabelaToSlug(`${nomeTabela}__${itemId}`) : caixaSlug;

          relacionados.push({
            id: itemId,
            nome: RENOMEAR_PRODUTO[item.nome] || item.nome,
            nome_original: item.nome,
            codigo,
            imagem_url: imagemUrl,
            categoria,
            caixa_tabela: nomeTabela,
            caixa_nome: isExpandida ? 'Equipamentos Médicos' : caixaNome,
            caixa_slug: itemCaixaSlug,
          });
        });
      }
    }

    // 2. Se não tiver suficiente, buscar de outras caixas da mesma categoria
    if (relacionados.length < limite) {
      const faltam = limite - relacionados.length;
      // Filtrar tabelas de produto único (não devem aparecer como relacionados individuais)
      const outrasCaixas = categoria === 'Instrumentação Cirúrgica CME'
        ? TABELAS_CME.filter(t => t !== nomeTabela)
        : TABELAS_EQUIPAMENTOS.filter(t => t !== nomeTabela && !isEquipamentoProdutoUnico(t));

      // Pegar algumas caixas aleatórias para variedade
      const caixasSelecionadas = outrasCaixas.sort(() => Math.random() - 0.5).slice(0, 3);

      for (const outraCaixa of caixasSelecionadas) {
        if (relacionados.length >= limite) break;

        // IMPORTANTE: Ordenar por nome para consistência com busca por índice
        const { data, error } = await supabase
          .from(outraCaixa)
          .select('*')
          .order('nome', { ascending: true })
          .limit(faltam);

        if (!error && data) {
          const outraCaixaSlug = tabelaToSlug(outraCaixa);
          const outraCaixaNome = tabelaToNomeExibicao(outraCaixa);

          data.forEach((item: any, index: number) => {
            if (relacionados.length >= limite) return;

            // Verificar se o produto deve ser oculto
            if (produtoDeveSerOcultoDaTabela(item.nome || '', outraCaixa)) return;

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

            // IMPORTANTE: Se item.id não existe, usar index + 1 (1-based) para consistência
            relacionados.push({
              id: item.id ?? (index + 1),
              nome: RENOMEAR_PRODUTO[item.nome] || item.nome,
              nome_original: item.nome,
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

// Padrão para "PONTA NxM" (ex: PONTA 2X10MMR, PONTA 3X10R, PONTA 4X10)
// Captura: PONTA + número + X + número + sufixo opcional (MMR, R, MM, etc)
const PADRAO_PONTA = /\s*PONTA\s+(\d+)\s*[xX×]\s*(\d+)\s*(mmr?|r)?$/i;

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
      variacao: `${dim1}x${dim2}${unidade}`,
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
 * Configuração de agrupamentos especiais por tabela para variações
 * Define como identificar e agrupar produtos com padrões complexos
 */
interface ConfigAgrupamentoEspecial {
  padrao: RegExp;
  extrairGrupo: (nome: string) => string | null;
  extrairVariacao: (nome: string) => string | null;
}

const AGRUPAMENTOS_ESPECIAIS_VARIACOES: Record<string, ConfigAgrupamentoEspecial[]> = {
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
    },
    {
      // Cureta Baioneta Reta/Angulada MIS Starlet System N°0000 -> agrupa por tipo
      padrao: /cureta\s+baioneta\s+(reta|angulada)\s+mis\s+starlet\s+system/i,
      extrairGrupo: (nome: string) => {
        const match = nome.match(/cureta\s+baioneta\s+(reta|angulada)/i);
        return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() : null;
      },
      extrairVariacao: (nome: string) => {
        const match = nome.match(/n[°º]?\s*(\d+)/i);
        return match ? `N°${match[1]}` : null;
      },
    },
  ],
  'caixa de apoio lombar': [
    {
      // CURETA BUSHE 26,5 CM -> agrupa todas as Curetas Bushe
      padrao: /cureta\s+bushe/i,
      extrairGrupo: () => 'Bushe',
      extrairVariacao: (nome: string) => {
        const angMatch = nome.match(/(ang(?:ulada)?|reta|p\/?\s*tras)/i);
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
    },
    {
      // ELEVADOR COBB 25CM 20MM -> agrupa elevadores Cobb (não LLIF)
      padrao: /elevador\s+cobb\s+(?!llif)\d+\s*cm/i,
      extrairGrupo: () => 'Cobb',
      extrairVariacao: (nome: string) => {
        const cmMatch = nome.match(/(\d+)\s*cm/i);
        return cmMatch ? `${cmMatch[1]}cm` : null;
      },
    },
    {
      // FORMÃO SMITH-PETERSON 24CM X 6MM -> agrupa formões
      padrao: /form[aã]o\s+smith/i,
      extrairGrupo: () => 'Smith-Peterson',
      extrairVariacao: (nome: string) => {
        const match = nome.match(/x?\s*(\d+)\s*m+/i);
        return match ? `${match[1]}mm` : null;
      },
    },
    {
      // PINÇA KERRINSON 40° ANGULADA -> agrupa pinças 40° anguladas
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
    },
    {
      // PINÇA KERRINSON BICO P/ CIMA 40GRAU -> agrupa pinças bico p/ cima 40°
      padrao: /pin[cç]a\s+kerr?inson\s+bico\s+p\/?\s*cima\s+40/i,
      extrairGrupo: () => 'Bico P/Cima 40°',
      extrairVariacao: (nome: string) => {
        const mmMatch = nome.match(/(\d+[,.]?\d*)\s*mm/i);
        return mmMatch ? `${mmMatch[1].replace(',', '.')}mm` : null;
      },
    },
    {
      // PINÇA KERRINSON RETA P/ CIMA -> agrupa pinças retas p/ cima por comprimento
      padrao: /pin[cç]a\s+kerr?inson\s+reta\s+p\/?\s*cima/i,
      extrairGrupo: (nome: string) => {
        const cmMatch = nome.match(/(\d+)\s*cm/i);
        return cmMatch ? `Reta ${cmMatch[1]}cm` : 'Reta';
      },
      extrairVariacao: (nome: string) => {
        const mmMatch = nome.match(/(\d+[,.]?\d*)\s*mm/i);
        return mmMatch ? `${mmMatch[1].replace(',', '.')}mm` : null;
      },
    },
    {
      // CURETA SIMON 22CM PONTA RETA/ANGULADA -> agrupa por tipo de ponta
      padrao: /cureta\s+simon\s+22\s*cm\s+ponta/i,
      extrairGrupo: (nome: string) => {
        const pontaMatch = nome.match(/ponta\s+(reta|angulada)/i);
        return pontaMatch ? `Simon ${pontaMatch[1].charAt(0).toUpperCase() + pontaMatch[1].slice(1).toLowerCase()}` : 'Simon';
      },
      extrairVariacao: (nome: string) => {
        const numMatch = nome.match(/n[°º]?\s*(\d+)/i);
        return numMatch ? `N°${numMatch[1]}` : null;
      },
    },
  ],
};

/**
 * Busca variações usando agrupamentos especiais (para produtos como Afastador MIS, Cureta Baioneta)
 */
function buscarVariacoesEspeciais(
  instrumentoAtual: any,
  todosInstrumentos: any[],
  nomeTabela: string
): VariacaoInstrumento[] {
  const tabelaLower = nomeTabela.toLowerCase();
  const configs = AGRUPAMENTOS_ESPECIAIS_VARIACOES[tabelaLower];

  if (!configs) return [];

  // Verificar se o instrumento atual corresponde a algum padrão especial
  for (const config of configs) {
    if (config.padrao.test(instrumentoAtual.nome)) {
      const grupoAtual = config.extrairGrupo(instrumentoAtual.nome);
      if (!grupoAtual) continue;

      // Encontrar todos os instrumentos do mesmo grupo
      const variacoes: VariacaoInstrumento[] = [];

      for (let idx = 0; idx < todosInstrumentos.length; idx++) {
        const item = todosInstrumentos[idx];

        if (config.padrao.test(item.nome)) {
          const grupoItem = config.extrairGrupo(item.nome);

          // Verificar se pertence ao mesmo grupo
          if (grupoItem === grupoAtual) {
            const variacao = config.extrairVariacao(item.nome);
            const itemId = item.id ?? (idx + 1);

            let imagemUrl = item.imagem_url || item.imagem || null;
            if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

            variacoes.push({
              id: itemId,
              nome: item.nome,
              codigo: item.codigo || null,
              descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || null,
              imagem_url: imagemUrl,
              variacaoTexto: variacao || 'Original',
              tipoVariacao: 'medida',
            });
          }
        }
      }

      // Ordenar variações numericamente
      if (variacoes.length > 1) {
        variacoes.sort((a, b) => {
          const numA = parseInt(a.variacaoTexto.replace(/\D/g, '') || '0', 10);
          const numB = parseInt(b.variacaoTexto.replace(/\D/g, '') || '0', 10);
          return numA - numB;
        });
        return variacoes;
      }
    }
  }

  return [];
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

    // Verificar se é um agrupamento especial (ex: Afastador MIS, Cureta Baioneta)
    const variacoesEspeciais = buscarVariacoesEspeciais(instrumentoAtual, todosInstrumentos, nomeTabela);
    if (variacoesEspeciais.length > 0) {
      console.log(`[getVariacoesInstrumento] Encontradas ${variacoesEspeciais.length} variações especiais`);
      return variacoesEspeciais;
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

      // Pular produtos que devem ser ocultos
      if (produtoDeveSerOcultoDaTabela(item.nome || '', nomeTabela)) {
        continue;
      }

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
          descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || null,
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
/**
 * Equipamentos que devem ser tratados como produto único (similar ao OPME)
 * - Não mostra variações na página de detalhes
 * - Redireciona direto da listagem para a página de detalhes
 * Usar nome da tabela em minúsculas
 */
export const EQUIPAMENTOS_PRODUTO_UNICO: string[] = [
  'arthrocare quantum 2 rf + pedal',
  'gerador rf  surgimax plus + pedal',
  'stryker 5400-50 core console + pedal',
];

/**
 * Tabelas de equipamentos que devem ser expandidas na listagem principal.
 * Cada item da tabela aparece como um card individual (como se fosse produto único).
 * O slug gerado é: `equipamentos_medicos__<id>`
 */
const TABELAS_EQUIPAMENTOS_EXPANDIDOS = ['equipamentos_medicos'];

/**
 * Verifica se uma tabela é de equipamentos expandidos
 * (cada item aparece como card individual na página principal)
 */
export function isEquipamentoExpandido(nomeTabela: string): boolean {
  return TABELAS_EQUIPAMENTOS_EXPANDIDOS.includes(nomeTabela.toLowerCase().trim());
}

/**
 * Verifica se um equipamento deve ser tratado como produto único
 * @param nomeTabela - Nome da tabela do equipamento
 * @returns true se deve ser tratado como produto único
 */
export function isEquipamentoProdutoUnico(nomeTabela: string): boolean {
  return EQUIPAMENTOS_PRODUTO_UNICO.includes(nomeTabela.toLowerCase().trim());
}

export async function getVariacoesEquipamento(
  nomeTabela: string,
  equipamentoId: number
): Promise<VariacaoInstrumento[]> {
  console.log(`[getVariacoesEquipamento] Buscando variações para ID ${equipamentoId} em "${nomeTabela}"`);

  // Verificar se este equipamento deve ser tratado como produto único (sem variações)
  if (isEquipamentoProdutoUnico(nomeTabela)) {
    console.log(`[getVariacoesEquipamento] Equipamento "${nomeTabela}" configurado como produto único`);
    return [];
  }

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
          descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || null,
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

/**
 * ========================================
 * FUNÇÕES PARA BUSCAR PRODUTO COM IMAGENS (1:N)
 * ========================================
 */

/**
 * Interface para imagem de produto
 */
export interface ImagemProduto {
  id: string;
  produto_id: number;
  url: string;
  ordem: number;
  principal: boolean;
  created_at?: string;
}

/**
 * Interface para produto com imagens
 */
export interface ProdutoComImagens {
  id: number;
  nome: string;
  descricao: string | null;
  codigo?: string | null;
  categoria?: string | null;
  imagemPrincipal: string | null;
  galeriaDeImagens: ImagemProduto[];
}

/**
 * Busca um produto específico com suas imagens relacionadas
 * @param nomeTabela - Nome da tabela do produto
 * @param produtoId - ID do produto
 * @returns Produto com imagens ou null
 */
export async function getProdutoComImagens(
  nomeTabela: string,
  produtoId: number
): Promise<ProdutoComImagens | null> {
  console.log(`[getProdutoComImagens] Buscando produto ID ${produtoId} em "${nomeTabela}"`);

  try {
    // 1. Buscar dados do produto
    const { data: produto, error: erroProduto } = await supabase
      .from(nomeTabela)
      .select('id, nome, descricao, codigo, categoria')
      .eq('id', produtoId)
      .single();

    if (erroProduto || !produto) {
      console.error('[getProdutoComImagens] Produto não encontrado:', erroProduto?.message);
      return null;
    }

    // 2. Verificar se existe tabela de imagens para este produto
    const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];

    let imagens: ImagemProduto[] = [];

    if (tabelaImagens) {
      // 3. Buscar imagens relacionadas ordenadas por "ordem"
      const { data: imagensData, error: erroImagens } = await supabase
        .from(tabelaImagens)
        .select('id, produto_id, url, ordem, principal, created_at')
        .eq('produto_id', produtoId)
        .order('ordem', { ascending: true });

      if (!erroImagens && imagensData) {
        imagens = imagensData;
      }
    }

    // 4. Identificar imagem principal
    const imagemPrincipalObj = imagens.find(img => img.principal === true) || imagens[0];
    const imagemPrincipal = imagemPrincipalObj?.url || null;

    console.log(`[getProdutoComImagens] Encontradas ${imagens.length} imagens para produto ${produtoId}`);

    return {
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao || null,
      codigo: produto.codigo || null,
      categoria: produto.categoria || null,
      imagemPrincipal,
      galeriaDeImagens: imagens,
    };
  } catch (error) {
    console.error('[getProdutoComImagens] Erro:', error);
    return null;
  }
}

/**
 * Busca múltiplos produtos com suas imagens (para listagens)
 * @param nomeTabela - Nome da tabela do produto
 * @param limite - Quantidade máxima de produtos
 * @returns Array de produtos com imagem principal
 */
export async function getProdutosComImagemPrincipal(
  nomeTabela: string,
  limite: number = 20
): Promise<ProdutoComImagens[]> {
  console.log(`[getProdutosComImagemPrincipal] Buscando produtos em "${nomeTabela}"`);

  try {
    // 1. Buscar produtos
    const { data: produtos, error: erroProdutos } = await supabase
      .from(nomeTabela)
      .select('id, nome, descricao, codigo, categoria')
      .limit(limite);

    if (erroProdutos || !produtos) {
      console.error('[getProdutosComImagemPrincipal] Erro:', erroProdutos?.message);
      return [];
    }

    // 2. Verificar se existe tabela de imagens
    const tabelaImagens = MAPEAMENTO_TABELAS_IMAGENS[nomeTabela];

    if (!tabelaImagens) {
      // Retorna produtos sem imagens da galeria
      return produtos.map(p => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao || null,
        codigo: p.codigo || null,
        categoria: p.categoria || null,
        imagemPrincipal: null,
        galeriaDeImagens: [],
      }));
    }

    // 3. Buscar todas as imagens principais de uma vez
    const produtoIds = produtos.map(p => p.id);
    const { data: imagensData, error: erroImagens } = await supabase
      .from(tabelaImagens)
      .select('id, produto_id, url, ordem, principal, created_at')
      .in('produto_id', produtoIds)
      .order('ordem', { ascending: true });

    // 4. Criar mapa de imagens por produto
    const imagensPorProduto = new Map<number, ImagemProduto[]>();
    if (!erroImagens && imagensData) {
      imagensData.forEach(img => {
        const lista = imagensPorProduto.get(img.produto_id) || [];
        lista.push(img);
        imagensPorProduto.set(img.produto_id, lista);
      });
    }

    // 5. Montar resultado
    return produtos.map(p => {
      const imagens = imagensPorProduto.get(p.id) || [];
      const imagemPrincipalObj = imagens.find(img => img.principal) || imagens[0];

      return {
        id: p.id,
        nome: p.nome,
        descricao: p.descricao || null,
        codigo: p.codigo || null,
        categoria: p.categoria || null,
        imagemPrincipal: imagemPrincipalObj?.url || null,
        galeriaDeImagens: imagens,
      };
    });
  } catch (error) {
    logError('[getProdutosComImagemPrincipal] Erro:', error);
    return [];
  }
}

/**
 * ========================================
 * VERSÕES CACHEADAS DAS FUNÇÕES PRINCIPAIS
 * ========================================
 * Usar estas funções nas páginas para melhor performance
 */

/**
 * Versão cacheada de getCaixasCME
 * Cache de 10 minutos para listagem de caixas CME
 */
export const getCaixasCMECached = unstable_cache(
  async () => getCaixasCME(),
  ['caixas-cme'],
  { revalidate: CACHE_CONFIG.CATEGORIAS.revalidate, tags: ['caixas-cme'] }
);

/**
 * Versão cacheada de getCategoriasEquipamentos
 * Cache de 10 minutos para listagem de categorias de equipamentos
 */
export const getCategoriasEquipamentosCached = unstable_cache(
  async () => getCategoriasEquipamentos(),
  ['categorias-equipamentos'],
  { revalidate: CACHE_CONFIG.CATEGORIAS.revalidate, tags: ['categorias-equipamentos'] }
);

/**
 * Versão cacheada de getTodosProdutosCatalogo (apenas para busca sem filtros)
 * Cache de 5 minutos para o catálogo completo
 */
export const getCatalogoCached = unstable_cache(
  async () => getTodosProdutosCatalogo({ porPagina: 1000 }),
  ['catalogo-completo'],
  { revalidate: CACHE_CONFIG.PRODUTOS.revalidate, tags: ['catalogo'] }
);

/**
 * Versão cacheada de getInstrumentosDaTabela
 * Cache de 5 minutos por tabela
 */
export function getInstrumentosDaTabelaCached(nomeTabela: string, pagina: number = 1, porPagina: number = 20) {
  return unstable_cache(
    async () => getInstrumentosDaTabela(nomeTabela, pagina, porPagina),
    [`instrumentos-${nomeTabela}-${pagina}-${porPagina}`],
    { revalidate: CACHE_CONFIG.PRODUTOS.revalidate, tags: ['instrumentos', nomeTabela] }
  )();
}

/**
 * Versão cacheada de getEquipamentosDaTabela
 * Cache de 5 minutos por tabela
 */
export function getEquipamentosDaTabelaCached(nomeTabela: string, pagina: number = 1, porPagina: number = 20) {
  return unstable_cache(
    async () => getEquipamentosDaTabela(nomeTabela, pagina, porPagina),
    [`equipamentos-${nomeTabela}-${pagina}-${porPagina}`],
    { revalidate: CACHE_CONFIG.PRODUTOS.revalidate, tags: ['equipamentos', nomeTabela] }
  )();
}

/**
 * ========================================
 * FUNÇÕES PARA OPME (Órteses, Próteses e Materiais Especiais)
 * ========================================
 */

/**
 * Busca todos os produtos OPME com paginação e filtros
 */
export async function getProdutosOPME(options: {
  pagina?: number;
  porPagina?: number;
  busca?: string;
  categoria?: string;
} = {}): Promise<ProdutosOPMEPaginados> {
  const { pagina = 1, porPagina = 24, busca = '', categoria = '' } = options;

  console.log('[getProdutosOPME] Buscando produtos...', { pagina, porPagina, busca, categoria });

  try {
    let query = supabase
      .from('produtos_opme')
      .select('*', { count: 'exact' });

    // Filtro por busca
    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,descricao.ilike.%${busca}%,fabricante.ilike.%${busca}%`);
    }

    // Filtro por categoria
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    // Ordenação e paginação
    const from = (pagina - 1) * porPagina;
    const to = from + porPagina - 1;

    query = query
      .order('nome', { ascending: true })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[getProdutosOPME] Erro:', error);
      return { produtos: [], total: 0, pagina, porPagina, totalPaginas: 0 };
    }

    // Filtrar produtos ocultos
    const produtosFiltrados = (data || []).filter((p: ProdutoOPME) => !produtoOPMEDeveSerOculto(p.id));

    // Adicionar produtos de tabelas OPME extras
    const TABELAS_OPME_EXTRAS = ['kit_cirurgico_easycore_hip', 'kit-brocas-diamantadas-biometal'];
    for (const tabelaExtra of TABELAS_OPME_EXTRAS) {
      try {
        const { data: extraData, error: extraError } = await supabase
          .from(tabelaExtra)
          .select('*')
          .order('nome', { ascending: true });
        if (!extraError && extraData && extraData.length > 0) {
          extraData.forEach((item: any, index: number) => {
            // Filtrar por busca se necessário
            if (busca) {
              const buscaLower = busca.toLowerCase();
              const match = (item.nome || '').toLowerCase().includes(buscaLower) ||
                            (item.descricao || '').toLowerCase().includes(buscaLower);
              if (!match) return;
            }
            // Usar ID alto para evitar colisão com produtos_opme
            const idUnico = 90000 + TABELAS_OPME_EXTRAS.indexOf(tabelaExtra) * 100 + (item.id || (index + 1));
            produtosFiltrados.push({
              id: idUnico,
              nome: item.nome || tabelaToNomeExibicao(tabelaExtra),
              categoria: item.categoria || 'OPME',
              descricao: (item.nome && DESCRICAO_CUSTOMIZADA[item.nome]) || item.descricao || null,
              imagem_url: item.imagem_url || null,
              _tabelaOrigem: tabelaExtra,
              _idOriginal: item.id || (index + 1),
            } as any);
          });
          console.log(`[getProdutosOPME] Tabela OPME extra "${tabelaExtra}": ${extraData.length} itens`);
        }
      } catch (err) {
        console.error(`[getProdutosOPME] Erro tabela OPME extra "${tabelaExtra}":`, err);
      }
    }

    // Ajustar contagem total (subtrair produtos ocultos)
    const produtosOcultosCount = (data || []).length - ((data || []).filter((p: ProdutoOPME) => !produtoOPMEDeveSerOculto(p.id)).length);
    const total = produtosFiltrados.length;
    const totalPaginas = Math.ceil(total / porPagina);

    console.log(`[getProdutosOPME] Encontrados ${produtosFiltrados.length} produtos de ${total} total (${produtosOcultosCount} ocultos)`);

    // Aplicar paginação após incluir extras
    const from2 = (pagina - 1) * porPagina;
    const produtosPaginados = produtosFiltrados.slice(from2, from2 + porPagina);

    return {
      produtos: produtosPaginados,
      total,
      pagina,
      porPagina,
      totalPaginas,
    };
  } catch (error) {
    console.error('[getProdutosOPME] Erro inesperado:', error);
    return { produtos: [], total: 0, pagina, porPagina, totalPaginas: 0 };
  }
}

/**
 * Busca um produto OPME por ID
 */
export async function getProdutoOPMEById(id: number): Promise<ProdutoOPME | null> {
  console.log('[getProdutoOPMEById] Buscando produto ID:', id);

  try {
    const { data, error } = await supabase
      .from('produtos_opme')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[getProdutoOPMEById] Erro:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[getProdutoOPMEById] Erro inesperado:', error);
    return null;
  }
}

/**
 * Busca categorias disponíveis de produtos OPME
 */
export async function getCategoriasOPME(): Promise<string[]> {
  console.log('[getCategoriasOPME] Buscando categorias...');

  try {
    const { data, error } = await supabase
      .from('produtos_opme')
      .select('categoria')
      .order('categoria');

    if (error) {
      console.error('[getCategoriasOPME] Erro:', error);
      return [];
    }

    // Extrair categorias únicas
    const categoriasUnicas = [...new Set(data?.map(p => p.categoria).filter(Boolean) || [])];
    console.log(`[getCategoriasOPME] Encontradas ${categoriasUnicas.length} categorias`);

    return categoriasUnicas;
  } catch (error) {
    console.error('[getCategoriasOPME] Erro inesperado:', error);
    return [];
  }
}

/**
 * Versão cacheada de getProdutosOPME
 */
export const getProdutosOPMECached = unstable_cache(
  async () => getProdutosOPME({ porPagina: 100 }),
  ['produtos-opme'],
  { revalidate: CACHE_CONFIG.PRODUTOS.revalidate, tags: ['opme'] }
);

/**
 * Versão cacheada de getCategoriasOPME
 */
export const getCategoriasOPMECached = unstable_cache(
  async () => getCategoriasOPME(),
  ['categorias-opme'],
  { revalidate: CACHE_CONFIG.CATEGORIAS.revalidate, tags: ['opme-categorias'] }
);
