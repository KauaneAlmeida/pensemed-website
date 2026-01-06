import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEquipamentoPorId, getCategoriasEquipamentos, getProdutosRelacionados, getVariacoesEquipamento, TABELAS_EQUIPAMENTOS, VariacaoInstrumento } from '@/lib/api';
import { slugToTabela, codigoValido, enriquecerDescricaoEquipamento } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import EquipamentoDetalhes from '@/components/EquipamentoDetalhes';
import ProdutoRelacionadoCard from '@/components/ProdutoRelacionadoCard';
import BackButton from '@/components/BackButton';

export const dynamic = 'force-dynamic';

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
      let data: any = null;

      // Primeiro tentar buscar por coluna 'id'
      const resultado = await supabase
        .from(tabela)
        .select('*')
        .eq('id', id)
        .single();

      if (!resultado.error && resultado.data) {
        data = resultado.data;
      } else if (resultado.error?.code === '42703') {
        // Tabela não tem coluna 'id', buscar por índice
        console.log(`Tabela ${tabela} não tem coluna id, buscando por índice...`);
        const { data: allData, error: allError } = await supabase
          .from(tabela)
          .select('*')
          .order('nome', { ascending: true });

        if (!allError && allData) {
          const idxBuscado = id - 1;
          if (idxBuscado >= 0 && idxBuscado < allData.length) {
            data = allData[idxBuscado];
          }
        }
      }

      if (data) {
        console.log('ENCONTRADO na tabela:', tabela);
        let imagemUrl = data.imagem_url || data.imagem || null;
        if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

        return {
          equipamento: {
            id: data.id || id,
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
          <div className="flex items-center justify-between gap-4 mb-3">
            <BackButton
              fallbackUrl={`/equipamentos-medicos/${params.categoria}`}
              label="Voltar"
            />
          </div>
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 lg:py-12">
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
          nomeTabela={nomeTabela}
        />
      </div>

      {/* Seção de Produtos Relacionados */}
      {produtosRelacionados.length > 0 && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="border-t border-gray-200 pt-6 sm:pt-8 lg:pt-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">Produtos Relacionados</h2>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {produtosRelacionados.map((relacionado) => (
                <ProdutoRelacionadoCard
                  key={`${relacionado.caixa_tabela}-${relacionado.id}`}
                  id={relacionado.id}
                  nome={relacionado.nome}
                  caixaTabela={relacionado.caixa_tabela}
                  caixaSlug={relacionado.caixa_slug}
                  caixaNome={relacionado.caixa_nome}
                  imagemUrlFallback={relacionado.imagem_url}
                  tipo="equipamentos"
                />
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
