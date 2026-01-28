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
  'caixa_de_apoio_cervical_imagens',
];

/**
 * Tabelas que usam produto_nome com busca por similaridade
 * (nomes na tabela de imagens são genéricos, sem medidas específicas)
 */
const TABELAS_COM_BUSCA_SIMILARIDADE = [
  'caixa_de_apoio_alif_imagens',
];

/**
 * Slugs a serem ignorados por tabela (imagens com URLs inválidas no storage)
 * Esses slugs não serão exibidos mesmo que existam no banco
 */
const SLUGS_IGNORAR: Record<string, string[]> = {
  'caixa_de_apoio_lombar_imagens': [
    'cureta-caspar-ponta-quadrada',
    'lamina-afastador-caspar',
    'ponta-aspirador-cushing',
    'ponta-aspirador-frazier',
  ],
};

/**
 * Tabelas com estrutura especial (nome, url_imagem, produto_slug)
 * Diferente do padrão (produto_id/produto_nome, url, principal)
 */
const TABELAS_ESTRUTURA_ESPECIAL: Record<string, {
  campoBusca: string;       // Campo para buscar o produto (nome ou produto_slug)
  campoUrl: string;         // Campo que contém a URL da imagem
  usarSlug: boolean;        // Se deve converter o nome para slug antes de buscar
}> = {
  'caixa_de_apoio_lombar_imagens': {
    campoBusca: 'produto_slug',
    campoUrl: 'url_imagem',
    usarSlug: true,
  },
};

/**
 * Converte nome do produto para slug (formato usado na tabela de imagens)
 * Ex: "Cureta Bushe 26,5cm Reta" -> "cureta-bushe-265cm-reta"
 */
function gerarSlugProduto(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[,.:;]/g, '')          // Remove pontuação
    .replace(/[\/\\]/g, '-')         // Substitui barras por hífen
    .replace(/[^a-z0-9\s-]/g, '')    // Remove caracteres especiais
    .replace(/\s+/g, '-')            // Espaços para hífens
    .replace(/-+/g, '-')             // Remove hífens duplicados
    .replace(/^-|-$/g, '');          // Remove hífens no início/fim
}

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
 * Suporta tabelas com produto_id, produto_nome ou estrutura especial
 */
export async function getProductImages(
  productId: number,
  tableName: string,
  productName?: string
): Promise<{ data: ProductImage[] | null; error: string | null }> {
  try {
    // Verifica se deve redirecionar para outro produto (variações que compartilham imagens)
    const productIdParaBusca = REDIRECIONAR_IMAGEM_PRODUTO[productId] || productId;
    if (productIdParaBusca !== productId) {
      console.log(`[getProductImages] Redirecionando produto ${productId} para usar imagens do produto ${productIdParaBusca}`);
    }

    // Passa productId para permitir mapeamento especial de produtos com tabela de imagens própria
    const imageTableName = getImageTableName(tableName, productIdParaBusca);

    // Verifica se a tabela tem estrutura especial
    const estruturaEspecial = TABELAS_ESTRUTURA_ESPECIAL[imageTableName];

    // Verifica se a tabela usa produto_nome em vez de produto_id
    const usaProdutoNome = TABELAS_COM_PRODUTO_NOME.includes(imageTableName);

    // Verifica se a tabela usa busca por similaridade
    const usaBuscaSimilaridade = TABELAS_COM_BUSCA_SIMILARIDADE.includes(imageTableName);

    console.log(`[getProductImages] Buscando imagens para produto ${productId} em "${imageTableName}" (estruturaEspecial: ${!!estruturaEspecial}, usaProdutoNome: ${usaProdutoNome}, usaBuscaSimilaridade: ${usaBuscaSimilaridade})`);

    // Tratamento para tabelas com estrutura especial
    if (estruturaEspecial && productName) {
      // Se a tabela usa slug, converte o nome do produto para slug
      const slugCompleto = estruturaEspecial.usarSlug
        ? gerarSlugProduto(productName)
        : productName;

      console.log(`[getProductImages] Usando estrutura especial - campo: ${estruturaEspecial.campoBusca}, slug: "${slugCompleto}" (nome original: "${productName}")`);

      // Extrai palavras-chave importantes do slug (ignora números e medidas)
      const palavrasChave = slugCompleto
        .split('-')
        .filter(p => p.length > 2 && !/^\d+$/.test(p) && !['cm', 'mm', 'grau', 'fig'].includes(p));

      let data: any[] | null = null;
      let error: any = null;

      // Estratégia 1: Busca exata pelo slug completo
      const resultExato = await supabase
        .from(imageTableName)
        .select('*')
        .eq(estruturaEspecial.campoBusca, slugCompleto)
        .order('ordem', { ascending: true });

      if (!resultExato.error && resultExato.data && resultExato.data.length > 0) {
        data = resultExato.data;
        console.log(`[getProductImages] Busca exata encontrou ${data.length} imagens`);
      }

      // Função para calcular similaridade entre strings (definida aqui para uso nas estratégias)
      const calcularSimilaridade = (s1: string, s2: string): number => {
        const palavras1 = s1.split('-');
        const palavras2 = s2.split('-');
        let matches = 0;
        for (const p1 of palavras1) {
          // Match exato ou parcial (para lidar com variações como leksell/leksel)
          if (palavras2.some(p2 => p1 === p2 || p1.startsWith(p2) || p2.startsWith(p1))) {
            matches++;
          }
        }
        return matches / Math.max(palavras1.length, palavras2.length);
      };

      // Estratégia 2: Busca com as 2-3 primeiras palavras-chave
      if (!data || data.length === 0) {
        const prefixo = palavrasChave.slice(0, 3).join('-');
        if (prefixo) {
          console.log(`[getProductImages] Tentando busca por prefixo: "${prefixo}%"`);
          const resultPrefixo = await supabase
            .from(imageTableName)
            .select('*')
            .ilike(estruturaEspecial.campoBusca, `${prefixo}%`)
            .order('ordem', { ascending: true });

          if (!resultPrefixo.error && resultPrefixo.data && resultPrefixo.data.length > 0) {
            // Filtra slugs ignorados
            const slugsIgnorar = SLUGS_IGNORAR[imageTableName] || [];
            const dadosFiltrados = resultPrefixo.data.filter((img: any) => !slugsIgnorar.includes(img.produto_slug));

            // Verifica se há múltiplos slugs diferentes
            const slugsEncontrados = [...new Set(dadosFiltrados.map((img: any) => img.produto_slug))];

            if (slugsEncontrados.length === 1) {
              data = dadosFiltrados;
              console.log(`[getProductImages] Busca por prefixo encontrou ${data.length} imagens`);
            } else if (slugsEncontrados.length > 1) {
              // Múltiplos slugs - escolhe o mais similar (com threshold mínimo de 0.5)
              let melhorSlug = slugsEncontrados[0];
              let melhorScore = 0;
              for (const slug of slugsEncontrados) {
                const score = calcularSimilaridade(slugCompleto, slug);
                if (score > melhorScore) {
                  melhorScore = score;
                  melhorSlug = slug;
                }
              }
              // Só usa se o score for >= 0.5 (pelo menos 50% de similaridade)
              if (melhorScore >= 0.5) {
                data = dadosFiltrados.filter((img: any) => img.produto_slug === melhorSlug);
                console.log(`[getProductImages] Busca por prefixo: melhor match "${melhorSlug}" (score: ${melhorScore.toFixed(2)}, ${data.length} imagens)`);
              } else {
                console.log(`[getProductImages] Busca por prefixo: score muito baixo (${melhorScore.toFixed(2)}), ignorando`);
              }
            }
          }
        }
      }

      // Estratégia 3: Busca com apenas as 2 primeiras palavras-chave (mais genérica)
      // Usa scoring para encontrar o melhor match quando há múltiplos resultados
      if (!data || data.length === 0) {
        const prefixoCurto = palavrasChave.slice(0, 2).join('-');
        if (prefixoCurto && prefixoCurto !== palavrasChave.slice(0, 3).join('-')) {
          console.log(`[getProductImages] Tentando busca por prefixo curto: "${prefixoCurto}%"`);
          const resultPrefixoCurto = await supabase
            .from(imageTableName)
            .select('*')
            .ilike(estruturaEspecial.campoBusca, `${prefixoCurto}%`)
            .order('ordem', { ascending: true });

          if (!resultPrefixoCurto.error && resultPrefixoCurto.data && resultPrefixoCurto.data.length > 0) {
            // Filtra slugs ignorados
            const slugsIgnorarCurto = SLUGS_IGNORAR[imageTableName] || [];
            const dadosFiltradosCurto = resultPrefixoCurto.data.filter((img: any) => !slugsIgnorarCurto.includes(img.produto_slug));

            // Agrupa por slug e calcula score de similaridade
            const slugsEncontrados = [...new Set(dadosFiltradosCurto.map((img: any) => img.produto_slug))];

            // Encontra o slug com maior similaridade
            let melhorSlug = slugsEncontrados[0];
            let melhorScore = 0;
            for (const slug of slugsEncontrados) {
              const score = calcularSimilaridade(slugCompleto, slug);
              console.log(`[getProductImages] Score para "${slug}": ${score.toFixed(2)}`);
              if (score > melhorScore) {
                melhorScore = score;
                melhorSlug = slug;
              }
            }

            // Só usa se o score for >= 0.5 (pelo menos 50% de similaridade)
            if (melhorScore >= 0.5) {
              data = dadosFiltradosCurto.filter((img: any) => img.produto_slug === melhorSlug);
              console.log(`[getProductImages] Busca por prefixo curto: melhor match "${melhorSlug}" (score: ${melhorScore.toFixed(2)}, ${data.length} imagens)`);
            } else {
              console.log(`[getProductImages] Busca por prefixo curto: score muito baixo (${melhorScore.toFixed(2)}), ignorando`);
            }
          }
        }
      }

      if (error) {
        console.error(`[getProductImages] Erro ao buscar em "${imageTableName}":`, error.message);
        return { data: null, error: error.message };
      }

      // Filtra slugs que devem ser ignorados (imagens com URLs inválidas)
      const slugsIgnorar = SLUGS_IGNORAR[imageTableName] || [];
      const dadosFiltrados = (data || []).filter((item: any) => {
        const slug = item.produto_slug || '';
        if (slugsIgnorar.includes(slug)) {
          console.log(`[getProductImages] Ignorando slug com URL inválida: "${slug}"`);
          return false;
        }
        return true;
      });

      // Normaliza os dados para o formato padrão ProductImage
      const imagensNormalizadas: ProductImage[] = dadosFiltrados.map((item: any, index: number) => ({
        id: item.id || `${index}`,
        url: item[estruturaEspecial.campoUrl] || item.url_imagem || item.url,
        ordem: item.ordem || index,
        principal: item.ordem === 1 || index === 0,
        produto_nome: item.produto_slug || productName,
      }));

      console.log(`[getProductImages] Encontradas ${imagensNormalizadas.length} imagens (estrutura especial)`);
      return { data: imagensNormalizadas, error: null };
    }

    // Tratamento para tabelas com busca por similaridade (nomes genéricos sem medidas)
    if (usaBuscaSimilaridade && productName) {
      console.log(`[getProductImages] Usando busca por similaridade para "${productName}"`);

      // Normaliza o nome do produto para comparação
      const normalizarNome = (nome: string): string => {
        return nome
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[°º]/g, '')            // Remove símbolos de grau
          .trim();
      };

      // Extrai palavras-chave do nome (remove números e medidas)
      const extrairPalavrasChave = (nome: string): string[] => {
        return normalizarNome(nome)
          .split(/\s+/)
          .filter(p => p.length > 1 && !/^\d+[,.]?\d*$/.test(p) && !['MM', 'CM', 'X', 'N', 'N°', 'GR', 'GRAU'].includes(p));
      };

      const palavrasProduto = extrairPalavrasChave(productName);
      console.log(`[getProductImages] Palavras-chave do produto:`, palavrasProduto);

      // Busca todas as imagens da tabela
      const { data: todasImagens, error: erroImagens } = await supabase
        .from(imageTableName)
        .select('*')
        .order('ordem', { ascending: true });

      if (erroImagens) {
        console.error(`[getProductImages] Erro ao buscar imagens:`, erroImagens.message);
        return { data: null, error: erroImagens.message };
      }

      // Agrupa imagens por produto_nome
      const imagensPorProduto = new Map<string, any[]>();
      for (const img of todasImagens || []) {
        const nome = img.produto_nome;
        if (!imagensPorProduto.has(nome)) {
          imagensPorProduto.set(nome, []);
        }
        imagensPorProduto.get(nome)!.push(img);
      }

      // Calcula score de similaridade para cada produto na tabela de imagens
      let melhorMatch: { nome: string; score: number; imagens: any[] } | null = null;

      for (const [nomeImagem, imagens] of imagensPorProduto) {
        const palavrasImagem = extrairPalavrasChave(nomeImagem);

        // Conta quantas palavras-chave do produto estão presentes no nome da imagem
        let matchesProduto = 0;
        for (const palavraProduto of palavrasProduto) {
          // Match exato ou parcial (para lidar com variações de escrita)
          const temMatch = palavrasImagem.some(pi =>
            pi === palavraProduto ||
            pi.startsWith(palavraProduto) ||
            palavraProduto.startsWith(pi) ||
            // Lida com erros de escrita comuns (ex: LANGENBECK vs LANGEBECK)
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

        // Só considera se pelo menos 40% de match combinado E primeiras palavras fazem match
        if (score >= 0.4 && primeirasPalavrasFazMatch && segundasPalavrasFazMatch && (!melhorMatch || score > melhorMatch.score)) {
          melhorMatch = { nome: nomeImagem, score, imagens };
          console.log(`[getProductImages] Match encontrado: "${nomeImagem}" (score: ${score.toFixed(2)})`);
        }
      }

      if (melhorMatch) {
        console.log(`[getProductImages] Melhor match: "${melhorMatch.nome}" com ${melhorMatch.imagens.length} imagens`);
        return { data: melhorMatch.imagens, error: null };
      }

      console.log(`[getProductImages] Nenhum match encontrado para "${productName}"`);
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
      console.error(`[getProductImages] Erro ao buscar em "${imageTableName}":`, error.message);
      return { data: null, error: error.message };
    }

    // Remover duplicatas por URL (manter apenas a primeira ocorrência)
    const urlsVistas = new Set<string>();
    const dadosSemDuplicatas = (data || []).filter((img: any) => {
      const url = img.url;
      if (urlsVistas.has(url)) {
        return false;
      }
      urlsVistas.add(url);
      return true;
    });

    console.log(`[getProductImages] Encontradas ${dadosSemDuplicatas.length} imagens (${(data?.length || 0) - dadosSemDuplicatas.length} duplicatas removidas)`);
    return { data: dadosSemDuplicatas, error: null };
  } catch (err) {
    return { data: null, error: 'Erro ao buscar imagens' };
  }
}

/**
 * Mapeamento de produto_id para usar imagens de outro produto_id
 * Usado quando produtos similares (variações de tamanho) compartilham as mesmas imagens
 * Chave: produto_id que não tem imagem -> produto_id que tem as imagens
 */
const REDIRECIONAR_IMAGEM_PRODUTO: Record<number, number> = {
  // Brocas Ósseas TOM SHIELD (5mm-9mm) usam imagens da Broca 4mm (15002)
  15003: 15002, // 5mm -> 4mm
  15004: 15002, // 6mm -> 4mm
  15005: 15002, // 7mm -> 4mm
  15006: 15002, // 8mm -> 4mm
  15007: 15002, // 9mm -> 4mm
};

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
