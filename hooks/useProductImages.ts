import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface ProductImage {
  id: string;
  produto_id?: number;
  produto_nome?: string;
  url: string;
  ordem: number;
  principal: boolean;
  created_at?: string;
}

/**
 * Tabelas que usam produto_nome em vez de produto_id
 */
const TABELAS_COM_PRODUTO_NOME = [
  'caixa_de_apoio_alif_imagens',
  'caixa_de_apoio_cervical_imagens',
  'caixa_de_apoio_lombar_imagens',
];

/**
 * Hook para buscar imagens de um produto do Supabase
 */
export function useProductImages(productId: number | null, tableName: string) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !tableName) {
      setImages([]);
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      setError(null);

      try {
        // Converte nome da tabela para nome da tabela de imagens (passa productId para mapeamento especial)
        const imageTableName = getImageTableName(tableName, productId);

        const { data, error: fetchError } = await supabase
          .from(imageTableName)
          .select('*')
          .eq('produto_id', productId)
          .order('ordem', { ascending: true });

        if (fetchError) {
          console.error('[useProductImages] Erro:', fetchError.message);
          setError(fetchError.message);
          setImages([]);
        } else {
          setImages(data || []);
        }
      } catch (err) {
        console.error('[useProductImages] Erro inesperado:', err);
        setError('Erro ao buscar imagens');
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [productId, tableName]);

  // Retorna a imagem principal ou a primeira
  const mainImage = images.find(img => img.principal) || images[0] || null;

  return {
    images,
    mainImage,
    loading,
    error,
    hasImages: images.length > 0,
    imageCount: images.length,
  };
}

/**
 * Função utilitária para buscar imagens de forma assíncrona (sem hook)
 * Suporta tabelas com produto_id ou produto_nome
 */
export async function getProductImages(
  productId: number,
  tableName: string,
  productName?: string
): Promise<{ data: ProductImage[] | null; error: string | null }> {
  try {
    // Passa productId para permitir mapeamento especial de produtos com tabela de imagens própria
    const imageTableName = getImageTableName(tableName, productId);

    // Verifica se a tabela usa produto_nome em vez de produto_id
    const usaProdutoNome = TABELAS_COM_PRODUTO_NOME.includes(imageTableName);

    console.log(`[getProductImages] Buscando imagens para produto ${productId} em "${imageTableName}" (usaProdutoNome: ${usaProdutoNome})`);

    let query = supabase.from(imageTableName).select('*');

    if (usaProdutoNome && productName) {
      query = query.eq('produto_nome', productName);
    } else {
      query = query.eq('produto_id', productId);
    }

    const { data, error } = await query.order('ordem', { ascending: true });

    if (error) {
      console.error(`[getProductImages] Erro ao buscar em "${imageTableName}":`, error.message);
      return { data: null, error: error.message };
    }

    console.log(`[getProductImages] Encontradas ${data?.length || 0} imagens`);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'Erro ao buscar imagens' };
  }
}

/**
 * Mapeamento especial para produtos que têm tabelas de imagens próprias
 * Chave: "nomeTabela:produtoId" -> tabela de imagens específica
 * Usado quando um produto dentro de uma tabela tem sua própria tabela de imagens
 */
const MAPEAMENTO_PRODUTO_IMAGENS: Record<string, string> = {
  // Produtos da tabela "afastador abdominal all path – omni tract" com tabelas de imagens próprias
  'afastador abdominal all path – omni tract:2': 'fixador_mesa_all_path_imagens',
  'afastador abdominal all path – omni tract:3': 'haste_fixador_mesa_all_path_imagens',
  'afastador abdominal all path – omni tract:4': 'fixador_articulado_braco_central_all_path_imagens',
  'afastador abdominal all path – omni tract:5': 'braco_central_articulado_all_path_imagens',
  'afastador abdominal all path – omni tract:6': 'fixador_articulado_laminas_all_path_imagens',
  // Lâminas All Path (variações 01-10, ids 7-16)
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
  // Haste Dupla Secundária All Path
  'afastador abdominal all path – omni tract:18': 'haste_dupla_secundaria_all_path_imagens',
};

/**
 * Converte nome da tabela de produtos para nome da tabela de imagens
 * Ex: "afastador abdominal all path – omni tract" -> "afastador_abdominal_all_path_imagens"
 */
function getImageTableName(tableName: string, productId?: number): string {
  // Primeiro verificar se há mapeamento especial por produto
  if (productId) {
    const chaveEspecial = `${tableName}:${productId}`;
    if (MAPEAMENTO_PRODUTO_IMAGENS[chaveEspecial]) {
      console.log(`[getImageTableName] Usando mapeamento especial para ${chaveEspecial}`);
      return MAPEAMENTO_PRODUTO_IMAGENS[chaveEspecial];
    }
  }

  // Mapeamento manual para tabelas com nomes especiais
  const mappings: Record<string, string> = {
    // Tabelas existentes
    'afastador abdominal all path – omni tract': 'afastador_abdominal_all_path_imagens',
    'caixa apoio bucomaxilo': 'caixa_apoio_bucomaxilo_imagens',

    // Novas tabelas com produto_id
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

    // Novas tabelas com produto_nome (em vez de produto_id)
    'caixa de apoio alif': 'caixa_de_apoio_alif_imagens',
    'caixa de apoio cervical': 'caixa_de_apoio_cervical_imagens',
    'caixa de apoio lombar': 'caixa_de_apoio_lombar_imagens',

    // Tabelas de Equipamentos Médicos (nomes EXATOS das tabelas no Supabase)
    'arthrocare quantum 2 rf + pedal': 'arthrocare_quantum_2_rf_pedal_imagens',
    'b. braun stimuplex hns12': 'b_braun_stimuplex_hns12_imagens',
    'bomba de artroscopia flosteady 150': 'bomba_de_artroscopia_flosteady_imagens',
    'gerador de diatermia ellman surgimax 4.0 dual rf 120 ice': 'gerador_de_diatermia_ellman_surgitron_dual_rf_120_ice_imagens',
    'gerador de radiofrequencia multigen 4 canais': 'gerador_de_radiofrequencia_multigen_imagens',
    'gerador de rf  para manejo da dor coolief': 'gerador_de_rf_para_manejo_da_dor_coolief_imagens',
    'gerador rf  surgimax plus + pedal': 'gerador_rf_surgimax_plus_pedal_imagens',
    'laser lombar delight': 'laser_para_hernia_de_disco_lombar_delight_imagens',
    'stryker 5400-50 core console + pedal': 'stryker_core_console_pedal_imagens',
  };

  if (mappings[tableName]) {
    return mappings[tableName];
  }

  // Fallback: converte automaticamente
  // Remove caracteres especiais, substitui espaços por underscores
  return tableName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[–—]/g, '') // Remove travessões
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '_') // Espaços para underscores
    .replace(/_+/g, '_') // Remove underscores duplos
    .replace(/^_|_$/g, '') // Remove underscores no início/fim
    + '_imagens';
}

export { getImageTableName };

/**
 * Interface para imagens de produtos OPME
 */
export interface OPMEImage {
  id: number;
  produto_id: number;
  url: string;
  ordem: number;
  alt_text: string | null;
  created_at?: string;
}

/**
 * Busca imagens de um produto OPME específico
 */
export async function getOPMEProductImages(
  productId: number
): Promise<{ data: OPMEImage[] | null; error: string | null }> {
  try {
    console.log(`[getOPMEProductImages] Buscando imagens para produto OPME ${productId}`);

    const { data, error } = await supabase
      .from('produtos_opme_imagens')
      .select('*')
      .eq('produto_id', productId)
      .order('ordem', { ascending: true });

    if (error) {
      console.error(`[getOPMEProductImages] Erro:`, error.message);
      return { data: null, error: error.message };
    }

    console.log(`[getOPMEProductImages] Encontradas ${data?.length || 0} imagens`);
    return { data, error: null };
  } catch (err) {
    console.error('[getOPMEProductImages] Erro inesperado:', err);
    return { data: null, error: 'Erro ao buscar imagens OPME' };
  }
}

/**
 * Hook para buscar imagens de um produto OPME
 */
export function useOPMEProductImages(productId: number | null) {
  const [images, setImages] = useState<OPMEImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setImages([]);
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getOPMEProductImages(productId);

      if (fetchError) {
        setError(fetchError);
        setImages([]);
      } else {
        setImages(data || []);
      }

      setLoading(false);
    };

    fetchImages();
  }, [productId]);

  // Retorna a imagem principal (ordem = 0) ou a primeira
  const mainImage = images.find(img => img.ordem === 0) || images[0] || null;

  return {
    images,
    mainImage,
    loading,
    error,
    hasImages: images.length > 0,
    imageCount: images.length,
  };
}
