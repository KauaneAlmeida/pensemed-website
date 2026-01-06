import { unstable_cache } from 'next/cache';

/**
 * Configurações de cache para diferentes tipos de dados
 */
export const CACHE_CONFIG = {
  // Cache para listagem de produtos (5 minutos)
  PRODUTOS: {
    revalidate: 300,
    tags: ['produtos'],
  },
  // Cache para categorias/caixas (10 minutos)
  CATEGORIAS: {
    revalidate: 600,
    tags: ['categorias'],
  },
  // Cache para detalhes de produto (5 minutos)
  PRODUTO_DETALHE: {
    revalidate: 300,
    tags: ['produto-detalhe'],
  },
  // Cache para imagens (30 minutos)
  IMAGENS: {
    revalidate: 1800,
    tags: ['imagens'],
  },
} as const;

/**
 * Wrapper para criar funções com cache
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts: string[],
  config: { revalidate: number; tags: string[] }
): T {
  return unstable_cache(fn, keyParts, {
    revalidate: config.revalidate,
    tags: config.tags,
  }) as T;
}

/**
 * Helper para verificar se estamos em ambiente de desenvolvimento
 * Em dev, podemos querer menos cache para debugging
 */
export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Helper para log condicional (apenas em dev)
 */
export function devLog(message: string, ...args: any[]): void {
  if (isDev()) {
    console.log(message, ...args);
  }
}

/**
 * Helper para warn condicional (apenas em dev)
 */
export function devWarn(message: string, ...args: any[]): void {
  if (isDev()) {
    console.warn(message, ...args);
  }
}

/**
 * Helper para error (sempre loga)
 */
export function logError(message: string, ...args: any[]): void {
  console.error(message, ...args);
}
