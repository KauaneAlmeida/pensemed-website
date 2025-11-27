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
