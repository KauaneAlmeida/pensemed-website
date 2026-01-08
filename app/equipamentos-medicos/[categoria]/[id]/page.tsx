import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEquipamentoPorId, getCategoriasEquipamentos, getProdutosRelacionados, getVariacoesEquipamento, TABELAS_EQUIPAMENTOS, VariacaoInstrumento } from '@/lib/api';
import { slugToTabela, codigoValido, enriquecerDescricaoEquipamento } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import EquipamentoDetalhes from '@/components/EquipamentoDetalhes';
import ProdutoRelacionadoCard from '@/components/ProdutoRelacionadoCard';

// ISR: revalidar a cada 5 minutos
export const revalidate = 300;

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
    <div className="min-h-screen bg-white pt-20 sm:pt-24">
      {/* Breadcrumb discreto */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm sm:text-base text-gray-500">
            <Link href="/" className="hover:text-gray-700 transition-colors">
              Início
            </Link>
            <span>/</span>
            <Link
              href="/equipamentos-medicos"
              className="hover:text-gray-700 transition-colors"
            >
              Equipamentos Médicos
            </Link>
            <span>/</span>
            <Link
              href={`/equipamentos-medicos/${params.categoria}`}
              className="hover:text-gray-700 transition-colors"
            >
              {nomeExibicao}
            </Link>
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
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
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Produtos Relacionados</h2>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
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
