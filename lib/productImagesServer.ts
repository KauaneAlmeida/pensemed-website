/**
 * Funções server-safe para buscar imagens de produtos.
 * Este arquivo NÃO importa hooks React, então pode ser usado em Server Components.
 * Reimporta as funções utilitárias de useProductImages sem trazer useState/useEffect.
 */
import { supabase } from '@/lib/supabaseClient';

export interface ProductImageServer {
  id: string;
  produto_id?: number;
  produto_nome?: string;
  url: string;
  ordem: number;
  principal: boolean;
}

/**
 * Tabelas que usam produto_nome em vez de produto_id
 */
const TABELAS_COM_PRODUTO_NOME = [
  'caixa_de_apoio_cervical_imagens',
  'caixa_razek_interlaminar_transforaminal_imagens',
  'caixa_endoline_interlaminar_imagens',
  'caixa_instrucao_biportal_ube_imagens',
];

/**
 * Tabelas que usam produto_nome com busca por similaridade
 */
const TABELAS_COM_BUSCA_SIMILARIDADE = [
  'caixa_de_apoio_alif_imagens',
];

/**
 * Slugs a serem ignorados por tabela
 */
const SLUGS_IGNORAR: Record<string, string[]> = {};

/**
 * Tabelas com estrutura especial
 */
const TABELAS_ESTRUTURA_ESPECIAL: Record<string, {
  campoBusca: string;
  campoUrl: string;
  usarSlug: boolean;
}> = {
  'caixa_de_apoio_lombar_imagens': {
    campoBusca: 'produto_slug',
    campoUrl: 'url_imagem',
    usarSlug: true,
  },
};

/**
 * Corrige URLs de imagens com caminhos incorretos no Storage
 * - caixa-apoio-lombar → caixa-de-apoio-lombar
 * - telepack sem subpasta equipamentos-medicos
 * - Re-encoda espaços no path (%20)
 */
export function corrigirUrlImagem(url: string): string {
  if (!url) return url;
  let fixed = url;
  // Corrigir caminho sem "de"
  fixed = fixed.replace('/caixa-apoio-lombar/', '/caixa-de-apoio-lombar/');
  // Corrigir equipamentos fora da subpasta equipamentos-medicos
  fixed = fixed.replace('/instrumentos/telepack-video-endoscopio-karl-storz/', '/instrumentos/equipamentos-medicos/telepack-video-endoscopio-karl-storz/');
  fixed = fixed.replace('/instrumentos/bomba-infusao-stryker-arthropump/', '/instrumentos/equipamentos-medicos/bomba-infusao-stryker-arthropump/');
  fixed = fixed.replace('/instrumentos/fonte-luz-stryker-l9000/', '/instrumentos/equipamentos-medicos/fonte-luz-stryker-l9000/');
  fixed = fixed.replace('/instrumentos/console-camera-stryker-1188/', '/instrumentos/equipamentos-medicos/console-camera-stryker-1188/');
  fixed = fixed.replace('/instrumentos/microscopio-cirurgico-zeiss-opmi-pico/', '/instrumentos/equipamentos-medicos/microscopio-cirurgico-zeiss-opmi-pico/');
  fixed = fixed.replace('/instrumentos/motor-cirurgico-nks-surgic-pro-led/', '/instrumentos/equipamentos-medicos/motor-cirurgico-nks-surgic-pro-led/');
  fixed = fixed.replace('/instrumentos/afastador-tubular-vertebral-crystal-lux-safira/', '/instrumentos/equipamentos-medicos/afastador-tubular-vertebral-crystal-lux-safira/');
  fixed = fixed.replace('/instrumentos/console-shaver-stryker-crossfire-2/', '/instrumentos/equipamentos-medicos/console-shaver-stryker-crossfire-2/');
  fixed = fixed.replace('/instrumentos/sistema-perfuracao-cirurgica-nks-primado-2/', '/instrumentos/equipamentos-medicos/sistema-perfuracao-cirurgica-nks-primado-2/');
  fixed = fixed.replace('/instrumentos/motor-piezoeletrico-ultrassonico-cirurgico/', '/instrumentos/equipamentos-medicos/motor-piezoeletrico-ultrassonico-cirurgico/');
  // Corrigir typo no nome da pasta (clloward → cloward)
  fixed = fixed.replace('/pinca-clloward-', '/pinca-cloward-');
  // Corrigir extensão errada (afastador-taylor .png → .jpg)
  fixed = fixed.replace('/afastador-taylor/01.png', '/afastador-taylor/01.jpg');
  // Re-encodar espaços no path da URL (alguns registros têm %20 por espaços em nomes de pasta)
  const publicIdx = fixed.indexOf('/public/');
  if (publicIdx !== -1) {
    const base = fixed.substring(0, publicIdx + 8);
    const path = fixed.substring(publicIdx + 8);
    fixed = base + path.split('/').map(s => encodeURIComponent(decodeURIComponent(s))).join('/');
  }
  return fixed;
}

const REDIRECIONAR_IMAGEM_PRODUTO: Record<number, number> = {
  15003: 15002,
  15004: 15002,
  15005: 15002,
  15006: 15002,
  15007: 15002,
};

const MAPEAMENTO_PRODUTO_IMAGENS: Record<string, string> = {
  'afastador abdominal all path – omni tract:2': 'fixador_mesa_all_path_imagens',
  'afastador abdominal all path – omni tract:3': 'haste_fixador_mesa_all_path_imagens',
  'afastador abdominal all path – omni tract:4': 'fixador_articulado_braco_central_all_path_imagens',
  'afastador abdominal all path – omni tract:5': 'braco_central_articulado_all_path_imagens',
  'afastador abdominal all path – omni tract:6': 'fixador_articulado_laminas_all_path_imagens',
  'afastador abdominal all path – omni tract:7': 'lamina_all_path_imagens',
  'afastador abdominal all path – omni tract:8': 'lamina_all_path_imagens',
  'afastador abdominal all path – omni tract:9': 'lamina_all_path_imagens',
  'afastador abdominal all path – omni tract:10': 'lamina_all_path_imagens',
  'afastador abdominal all path – omni tract:11': 'lamina_all_path_imagens',
  'afastador abdominal all path – omni tract:12': 'lamina_all_path_imagens',
  'afastador abdominal all path – omni tract:13': 'lamina_all_path_imagens',
  'afastador abdominal all path – omni tract:14': 'lamina_all_path_imagens',
  'afastador abdominal all path – omni tract:15': 'lamina_all_path_imagens',
  'afastador abdominal all path – omni tract:16': 'lamina_all_path_imagens',
  'afastador abdominal all path – omni tract:18': 'haste_dupla_secundaria_all_path_imagens',
};

function gerarSlugProduto(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[,.:;]/g, '')
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getImageTableName(tableName: string, productId?: number): string {
  if (productId) {
    const chaveEspecial = `${tableName}:${productId}`;
    if (MAPEAMENTO_PRODUTO_IMAGENS[chaveEspecial]) {
      return MAPEAMENTO_PRODUTO_IMAGENS[chaveEspecial];
    }
  }

  const mappings: Record<string, string> = {
    'afastador abdominal all path – omni tract': 'afastador_abdominal_all_path_imagens',
    'caixa apoio bucomaxilo': 'caixa_apoio_bucomaxilo_imagens',
    'caixa baioneta mis': 'caixa_baioneta_mis_imagens',
    'caixa cervical translucente': 'caixa_cervical_translucente_imagens',
    'caixa endoscopia coluna': 'caixa_endoscopia_coluna_imagens',
    'caixa intrumentacao cirurgica cranio': 'caixa_intrumentacao_cirurgica_cranio_imagens',
    'caixa micro tesouras': 'caixa_micro_tesouras_imagens',
    'caixa microdissectores rhoton': 'caixa_microdissectores_rhoton_imagens',
    'instrumental cabo de fibra óptica compatível stryker': 'instrumental_cabo_de_fibra_optica_compativel_stryker_imagens',
    'instrumental peça de mão stryker formula': 'instrumental_peca_de_mao_stryker_formula_imagens',
    'kit afastadores tubulares endoscopia': 'kit_afastadores_tubulares_endoscopia_imagens',
    'instrumental de descompressão TOM SHIELD': 'instrumental_de_descompressao_tom_shield_imagens',
    'caixa de apoio alif': 'caixa_de_apoio_alif_imagens',
    'caixa de apoio cervical': 'caixa_de_apoio_cervical_imagens',
    'caixa de apoio lombar': 'caixa_de_apoio_lombar_imagens',
    'caixa_razek_interlaminar_transforaminal': 'caixa_razek_interlaminar_transforaminal_imagens',
    'caixa_endoline_interlaminar': 'caixa_endoline_interlaminar_imagens',
    'caixa_instrucao_biportal_ube': 'caixa_instrucao_biportal_ube_imagens',
    'craniotomo_drill_eletrico': 'craniotomo_drill_eletrico_imagens',
    'arthrocare quantum 2 rf + pedal': 'arthrocare_quantum_2_rf_pedal_imagens',
    'b. braun stimuplex hns12': 'b_braun_stimuplex_hns12_imagens',
    'bomba de artroscopia flosteady 150': 'bomba_de_artroscopia_flosteady_imagens',
    'gerador de diatermia ellman surgimax 4.0 dual rf 120 ice': 'gerador_de_diatermia_ellman_surgitron_dual_rf_120_ice_imagens',
    'gerador de radiofrequencia multigen 4 canais': 'gerador_de_radiofrequencia_multigen_imagens',
    'gerador de rf  para manejo da dor coolief': 'gerador_de_rf_para_manejo_da_dor_coolief_imagens',
    'gerador rf  surgimax plus + pedal': 'gerador_rf_surgimax_plus_pedal_imagens',
    'laser lombar delight': 'laser_para_hernia_de_disco_lombar_delight_imagens',
    'stryker 5400-50 core console + pedal': 'stryker_core_console_pedal_imagens',
    'equipamentos_medicos': 'equipamentos_medicos_imagens',
    'produtos_opme': 'produtos_opme_imagens',
  };

  if (mappings[tableName]) {
    return mappings[tableName];
  }

  return tableName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '')
    .replace(/[^a-z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    + '_imagens';
}

/**
 * Busca imagens de um produto - versão server-safe (sem hooks React)
 */
export async function getProductImagesServer(
  productId: number,
  tableName: string,
  productName?: string,
  imagemSlug?: string
): Promise<{ data: ProductImageServer[] | null; error: string | null }> {
  try {
    const productIdParaBusca = REDIRECIONAR_IMAGEM_PRODUTO[productId] || productId;
    const imageTableName = getImageTableName(tableName, productIdParaBusca);
    const estruturaEspecial = TABELAS_ESTRUTURA_ESPECIAL[imageTableName];
    const usaProdutoNome = TABELAS_COM_PRODUTO_NOME.includes(imageTableName);
    const usaBuscaSimilaridade = TABELAS_COM_BUSCA_SIMILARIDADE.includes(imageTableName);

    // Busca direta por imagem_slug quando disponível (mais confiável que geração de slug)
    if (estruturaEspecial && imagemSlug) {
      const resultSlug = await supabase
        .from(imageTableName)
        .select('*')
        .eq(estruturaEspecial.campoBusca, imagemSlug)
        .order('ordem', { ascending: true });

      if (!resultSlug.error && resultSlug.data && resultSlug.data.length > 0) {
        // Filtrar registros com URLs genéricas/erradas (URL não contém o slug do produto no path)
        const dadosValidos = resultSlug.data.filter((item: any) => {
          const rawUrl = item[estruturaEspecial.campoUrl] || item.url_imagem || item.url || '';
          const slug = item.produto_slug || imagemSlug || '';
          if (slug && rawUrl) {
            const urlParts = rawUrl.split('/');
            const produtoFolder = urlParts[urlParts.length - 2];
            const partesPrincipais = slug.split('-').filter((p: string) => p.length > 3);
            if (partesPrincipais.length >= 2 && produtoFolder) {
              const folderLower = produtoFolder.toLowerCase();
              const matchCount = partesPrincipais.filter((p: string) => folderLower.includes(p)).length;
              if (matchCount < partesPrincipais.length / 2) return false;
            }
          }
          return true;
        });
        const dadosFinais = dadosValidos.length > 0 ? dadosValidos : resultSlug.data;
        return {
          data: dadosFinais.map((item: any, index: number) => ({
            id: item.id || `${index}`,
            url: corrigirUrlImagem(item[estruturaEspecial.campoUrl] || item.url_imagem || item.url),
            ordem: item.ordem || index,
            principal: item.ordem === 1 || index === 0,
            produto_nome: item.produto_slug || productName,
          })),
          error: null,
        };
      }
    }

    // Tratamento para tabelas com estrutura especial
    if (estruturaEspecial && productName) {
      const slugCompleto = estruturaEspecial.usarSlug
        ? gerarSlugProduto(productName)
        : productName;

      const palavrasChave = slugCompleto
        .split('-')
        .filter(p => p.length > 2 && !/^\d+$/.test(p) && !['cm', 'mm', 'grau', 'fig'].includes(p));

      let data: any[] | null = null;

      const calcularSimilaridade = (s1: string, s2: string): number => {
        const palavras1 = s1.split('-');
        const palavras2 = s2.split('-');
        let matches = 0;
        for (const p1 of palavras1) {
          if (palavras2.some(p2 => p1 === p2 || p1.startsWith(p2) || p2.startsWith(p1))) {
            matches++;
          }
        }
        return matches / Math.max(palavras1.length, palavras2.length);
      };

      // Busca exata
      const resultExato = await supabase
        .from(imageTableName)
        .select('*')
        .eq(estruturaEspecial.campoBusca, slugCompleto)
        .order('ordem', { ascending: true });

      if (!resultExato.error && resultExato.data && resultExato.data.length > 0) {
        data = resultExato.data;
      }

      // Busca por prefixo
      if (!data || data.length === 0) {
        const prefixo = palavrasChave.slice(0, 3).join('-');
        if (prefixo) {
          const resultPrefixo = await supabase
            .from(imageTableName)
            .select('*')
            .ilike(estruturaEspecial.campoBusca, `${prefixo}%`)
            .order('ordem', { ascending: true });

          if (!resultPrefixo.error && resultPrefixo.data && resultPrefixo.data.length > 0) {
            const slugsIgnorar = SLUGS_IGNORAR[imageTableName] || [];
            const dadosFiltrados = resultPrefixo.data.filter((img: any) => !slugsIgnorar.includes(img.produto_slug));
            const slugsEncontrados = [...new Set(dadosFiltrados.map((img: any) => img.produto_slug))];

            if (slugsEncontrados.length === 1) {
              data = dadosFiltrados;
            } else if (slugsEncontrados.length > 1) {
              let melhorSlug = slugsEncontrados[0];
              let melhorScore = 0;
              for (const slug of slugsEncontrados) {
                const score = calcularSimilaridade(slugCompleto, slug);
                if (score > melhorScore) { melhorScore = score; melhorSlug = slug; }
              }
              if (melhorScore >= 0.5) {
                data = dadosFiltrados.filter((img: any) => img.produto_slug === melhorSlug);
              }
            }
          }
        }
      }

      // Busca por prefixo curto
      if (!data || data.length === 0) {
        const prefixoCurto = palavrasChave.slice(0, 2).join('-');
        if (prefixoCurto && prefixoCurto !== palavrasChave.slice(0, 3).join('-')) {
          const resultPrefixoCurto = await supabase
            .from(imageTableName)
            .select('*')
            .ilike(estruturaEspecial.campoBusca, `${prefixoCurto}%`)
            .order('ordem', { ascending: true });

          if (!resultPrefixoCurto.error && resultPrefixoCurto.data && resultPrefixoCurto.data.length > 0) {
            const slugsIgnorar = SLUGS_IGNORAR[imageTableName] || [];
            const dadosFiltrados = resultPrefixoCurto.data.filter((img: any) => !slugsIgnorar.includes(img.produto_slug));
            const slugsEncontrados = [...new Set(dadosFiltrados.map((img: any) => img.produto_slug))];
            let melhorSlug = slugsEncontrados[0];
            let melhorScore = 0;
            for (const slug of slugsEncontrados) {
              const score = calcularSimilaridade(slugCompleto, slug);
              if (score > melhorScore) { melhorScore = score; melhorSlug = slug; }
            }
            if (melhorScore >= 0.5) {
              data = dadosFiltrados.filter((img: any) => img.produto_slug === melhorSlug);
            }
          }
        }
      }

      const slugsIgnorar = SLUGS_IGNORAR[imageTableName] || [];
      const dadosFiltrados = (data || []).filter((item: any) => {
        const slug = item.produto_slug || '';
        if (slugsIgnorar.includes(slug)) return false;
        // Filtrar registros com URLs genéricas/erradas (URL não contém o slug do produto no path)
        const rawUrl = item[estruturaEspecial.campoUrl] || item.url_imagem || item.url || '';
        if (slug && rawUrl) {
          // Extrair o caminho do produto na URL (parte entre a pasta da tabela e o arquivo)
          const urlParts = rawUrl.split('/');
          const produtoFolder = urlParts[urlParts.length - 2]; // ex: lamina-afastador-cloward-lombar
          // Se a pasta do produto na URL não contém partes significativas do slug, é URL genérica
          const partesPrincipais = slug.split('-').filter((p: string) => p.length > 3);
          if (partesPrincipais.length >= 2 && produtoFolder) {
            const folderLower = produtoFolder.toLowerCase();
            const matchCount = partesPrincipais.filter((p: string) => folderLower.includes(p)).length;
            // Requer pelo menos metade das partes significativas
            if (matchCount < partesPrincipais.length / 2) return false;
          }
        }
        return true;
      });
      // Se todos foram filtrados, usar dados originais como fallback
      const dadosFinaisFiltrados = dadosFiltrados.length > 0 ? dadosFiltrados : (data || []).filter((item: any) => {
        const slug = item.produto_slug || '';
        return !slugsIgnorar.includes(slug);
      });

      const imagensNormalizadas: ProductImageServer[] = dadosFinaisFiltrados.map((item: any, index: number) => ({
        id: item.id || `${index}`,
        url: corrigirUrlImagem(item[estruturaEspecial.campoUrl] || item.url_imagem || item.url),
        ordem: item.ordem || index,
        principal: item.ordem === 1 || index === 0,
        produto_nome: item.produto_slug || productName,
      }));

      return { data: imagensNormalizadas, error: null };
    }

    // Busca por similaridade
    if (usaBuscaSimilaridade && productName) {
      const normalizarNome = (nome: string): string => {
        return nome.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[°º]/g, '').trim();
      };

      const extrairPalavrasChave = (nome: string): string[] => {
        return normalizarNome(nome).split(/\s+/).filter(p => p.length > 1 && !/^\d+[,.]?\d*$/.test(p) && !['MM', 'CM', 'X', 'N', 'N°', 'GR', 'GRAU'].includes(p));
      };

      const palavrasProduto = extrairPalavrasChave(productName);

      const { data: todasImagens, error: erroImagens } = await supabase
        .from(imageTableName)
        .select('*')
        .order('ordem', { ascending: true });

      if (erroImagens) {
        return { data: null, error: erroImagens.message };
      }

      const imagensPorProduto = new Map<string, any[]>();
      for (const img of todasImagens || []) {
        const nome = img.produto_nome;
        if (!imagensPorProduto.has(nome)) imagensPorProduto.set(nome, []);
        imagensPorProduto.get(nome)!.push(img);
      }

      let melhorMatch: { nome: string; score: number; imagens: any[] } | null = null;

      for (const [nomeImagem, imagens] of imagensPorProduto) {
        const palavrasImagem = extrairPalavrasChave(nomeImagem);

        let matchesProduto = 0;
        for (const pp of palavrasProduto) {
          if (palavrasImagem.some(pi => pi === pp || pi.startsWith(pp) || pp.startsWith(pi) || (pi.length > 4 && pp.length > 4 && pi.substring(0, 5) === pp.substring(0, 5)))) matchesProduto++;
        }

        let matchesImagem = 0;
        for (const pi of palavrasImagem) {
          if (palavrasProduto.some(pp => pp === pi || pp.startsWith(pi) || pi.startsWith(pp) || (pp.length > 4 && pi.length > 4 && pp.substring(0, 5) === pi.substring(0, 5)))) matchesImagem++;
        }

        const score = (matchesProduto / palavrasProduto.length + (palavrasImagem.length > 0 ? matchesImagem / palavrasImagem.length : 0)) / 2;

        const primeirasFazMatch = palavrasProduto.length > 0 && palavrasImagem.length > 0 &&
          (palavrasProduto[0] === palavrasImagem[0] || palavrasProduto[0].startsWith(palavrasImagem[0]) || palavrasImagem[0].startsWith(palavrasProduto[0]));

        const segundasFazMatch = palavrasProduto.length < 2 || palavrasImagem.length < 2 ||
          palavrasProduto.slice(0, 2).some(pp => palavrasImagem.slice(0, 2).some(pi => pp === pi || pp.startsWith(pi) || pi.startsWith(pp)));

        if (score >= 0.4 && primeirasFazMatch && segundasFazMatch && (!melhorMatch || score > melhorMatch.score)) {
          melhorMatch = { nome: nomeImagem, score, imagens };
        }
      }

      if (melhorMatch) {
        return { data: melhorMatch.imagens.map((img: any) => ({ ...img, url: corrigirUrlImagem(img.url) })), error: null };
      }

      return { data: [], error: null };
    }

    // Busca padrão
    let query = supabase.from(imageTableName).select('*');

    if (usaProdutoNome && productName) {
      query = query.eq('produto_nome', productName);
    } else {
      query = query.eq('produto_id', productIdParaBusca);
    }

    const { data, error } = await query.order('ordem', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    const urlsVistas = new Set<string>();
    const dadosSemDuplicatas = (data || []).filter((img: any) => {
      const url = img.url;
      if (urlsVistas.has(url)) return false;
      urlsVistas.add(url);
      return true;
    }).map((img: any) => ({ ...img, url: corrigirUrlImagem(img.url) }));

    return { data: dadosSemDuplicatas, error: null };
  } catch (err) {
    return { data: null, error: 'Erro ao buscar imagens' };
  }
}
