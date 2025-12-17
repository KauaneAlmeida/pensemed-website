import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getEquipamentoPorId, getCategoriasEquipamentos, getProdutosRelacionados, getVariacoesEquipamento, TABELAS_EQUIPAMENTOS, VariacaoInstrumento } from '@/lib/api';
import { slugToTabela, codigoValido, enriquecerDescricaoEquipamento } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import EquipamentoDetalhes from '@/components/EquipamentoDetalhes';

interface EquipamentoDetailPageProps {
  params: {
    categoria: string;
    id: string;
  };
}

/**
 * Busca equipamento tentando diferentes tabelas se necessário
 */
async function buscarEquipamentoComFallback(slug: string, id: number) {
  console.log('=== DEBUG BUSCA EQUIPAMENTO ===');
  console.log('Slug recebido:', slug);
  console.log('ID:', id);

  // Primeiro tenta decodificar o slug
  const nomeTabela = slugToTabela(slug);
  console.log('Nome tabela decodificado:', nomeTabela);

  // Tenta buscar na tabela decodificada
  let equipamento = await getEquipamentoPorId(nomeTabela, id);

  if (equipamento) {
    console.log('Encontrado na tabela principal:', nomeTabela);
    return { equipamento, nomeTabela };
  }

  console.log('Não encontrado na tabela principal, tentando fallback...');

  // Se não encontrou, tenta buscar em todas as tabelas de equipamentos
  for (const tabela of TABELAS_EQUIPAMENTOS) {
    console.log('Tentando tabela:', tabela);
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        console.log('ENCONTRADO na tabela:', tabela);
        let imagemUrl = data.imagem_url || data.imagem || null;
        if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

        return {
          equipamento: {
            id: data.id,
            nome: data.nome,
            categoria: data.categoria,
            codigo: data.codigo || null,
            descricao: data.descricao || null,
            imagem_url: imagemUrl,
          },
          nomeTabela: tabela,
        };
      }
    } catch (err) {
      console.warn(`Erro ao buscar em ${tabela}:`, err);
    }
  }

  console.log('Não encontrado em nenhuma tabela');
  console.log('=== FIM DEBUG ===');
  return { equipamento: null, nomeTabela };
}

export async function generateMetadata({
  params,
}: EquipamentoDetailPageProps): Promise<Metadata> {
  const slugDecodificado = decodeURIComponent(params.categoria);
  const equipamentoId = parseInt(params.id, 10);
  const { equipamento, nomeTabela } = await buscarEquipamentoComFallback(slugDecodificado, equipamentoId);

  if (!equipamento) {
    return {
      title: 'Equipamento não encontrado - PenseMed',
    };
  }

  const categorias = await getCategoriasEquipamentos();
  const categoria = categorias.find(c => c.nome_tabela === nomeTabela);
  const nomeExibicao = categoria?.nome_exibicao || equipamento.categoria;

  return {
    title: `${equipamento.nome} - ${nomeExibicao} | PenseMed`,
    description: equipamento.descricao || `Equipamento médico ${equipamento.nome} disponível para locação.`,
  };
}

export default async function EquipamentoDetailPage({
  params,
}: EquipamentoDetailPageProps) {
  const slugDecodificado = decodeURIComponent(params.categoria);
  const equipamentoId = parseInt(params.id, 10);

  const { equipamento, nomeTabela } = await buscarEquipamentoComFallback(slugDecodificado, equipamentoId);

  if (!equipamento) {
    console.error('[EquipamentoDetailPage] Equipamento não encontrado após fallback');
    notFound();
  }

  const categorias = await getCategoriasEquipamentos();
  const categoria = categorias.find(c => c.nome_tabela === nomeTabela);

  if (!categoria) {
    console.warn('[EquipamentoDetailPage] Categoria não encontrada para tabela:', nomeTabela);
  }

  const nomeExibicao = categoria?.nome_exibicao || equipamento.categoria || 'Equipamento Médico';

  // Verificar se o código é válido para exibição
  const mostrarCodigo = codigoValido(equipamento.codigo);

  // Enriquecer descrição se for curta
  const descricaoCompleta = enriquecerDescricaoEquipamento(
    equipamento.descricao,
    equipamento.nome,
    nomeExibicao
  );

  // Buscar variações do equipamento
  let variacoes: VariacaoInstrumento[] = [];
  if (equipamento.id) {
    variacoes = await getVariacoesEquipamento(nomeTabela, equipamento.id);
    console.log(`[EquipamentoDetailPage] Variações encontradas: ${variacoes.length}`);
  }

  // Buscar produtos relacionados
  const produtosRelacionados = await getProdutosRelacionados(
    nomeTabela,
    equipamentoId,
    'Equipamentos Médicos',
    4
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700">
              Início
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href="/equipamentos-medicos"
              className="text-emerald-600 hover:text-emerald-700"
            >
              Equipamentos Médicos
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href={`/equipamentos-medicos/${params.categoria}`}
              className="text-emerald-600 hover:text-emerald-700"
            >
              {nomeExibicao}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 truncate max-w-[200px]">{equipamento.nome}</span>
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EquipamentoDetalhes
          equipamento={{
            id: equipamento.id,
            nome: equipamento.nome,
            codigo: equipamento.codigo,
            descricao: equipamento.descricao,
            imagem_url: equipamento.imagem_url,
          }}
          variacoes={variacoes.map(v => ({
            id: v.id,
            nome: v.nome,
            codigo: v.codigo,
            descricao: v.descricao,
            imagem_url: v.imagem_url,
            variacaoTexto: v.variacaoTexto,
            tipoVariacao: v.tipoVariacao,
          }))}
          nomeExibicao={nomeExibicao}
          categoriaSlug={params.categoria}
          descricaoCompleta={descricaoCompleta}
          mostrarCodigo={mostrarCodigo}
        />
      </div>

      {/* Seção de Produtos Relacionados */}
      {produtosRelacionados.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Produtos Relacionados</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtosRelacionados.map((relacionado) => (
                <Link
                  key={`${relacionado.caixa_tabela}-${relacionado.id}`}
                  href={`/equipamentos-medicos/${relacionado.caixa_slug}/${relacionado.id}`}
                  className="group bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Imagem */}
                  <div className="aspect-square relative bg-gray-50">
                    {relacionado.imagem_url ? (
                      <Image
                        src={relacionado.imagem_url}
                        alt={relacionado.nome}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {relacionado.nome}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{relacionado.caixa_nome}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Botão ver mais */}
            <div className="text-center mt-8">
              <Link
                href={`/equipamentos-medicos/${params.categoria}`}
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Ver mais equipamentos desta categoria
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
