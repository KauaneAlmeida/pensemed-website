import { supabase } from './supabaseClient';
import { Produto, getCategoriaNameBySlug } from './types';

/**
 * Busca produtos por categoria
 * @param categoria - Nome da categoria (ex: "Equipamentos Médicos")
 * @returns Array de produtos da categoria especificada
 */
export async function getProdutosByCategoria(categoria: string): Promise<Produto[]> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('categoria', categoria)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar produtos por categoria:', error);
      throw new Error(`Erro ao buscar produtos: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erro na função getProdutosByCategoria:', error);
    return [];
  }
}

/**
 * Busca um único produto por slug
 * @param slug - Slug único do produto
 * @returns Produto encontrado ou null
 */
export async function getProdutoBySlug(slug: string): Promise<Produto | null> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Erro ao buscar produto por slug:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro na função getProdutoBySlug:', error);
    return null;
  }
}

/**
 * Busca todas as categorias distintas da tabela produtos
 * @returns Array de categorias únicas
 */
export async function getCategorias(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('categoria')
      .order('categoria', { ascending: true });

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      throw new Error(`Erro ao buscar categorias: ${error.message}`);
    }

    // Extrair categorias únicas
    const categoriasUnicas = [...new Set(data.map(item => item.categoria))];
    return categoriasUnicas;
  } catch (error) {
    console.error('Erro na função getCategorias:', error);
    return [];
  }
}

/**
 * Busca produtos recentes (últimos adicionados)
 * @param limit - Número de produtos a retornar
 * @returns Array de produtos recentes
 */
export async function getProdutosRecentes(limit: number = 6): Promise<Produto[]> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar produtos recentes:', error);
      throw new Error(`Erro ao buscar produtos recentes: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erro na função getProdutosRecentes:', error);
    return [];
  }
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
