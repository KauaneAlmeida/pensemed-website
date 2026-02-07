import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEquipamentoPorId, getCategoriasEquipamentos, getProdutosRelacionados, getVariacoesEquipamento, TABELAS_EQUIPAMENTOS, VariacaoInstrumento, isEquipamentoProdutoUnico } from '@/lib/api';
import { slugToTabela, codigoValido, enriquecerDescricaoEquipamento, tabelaToNomeExibicao } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { getProductImagesServer, corrigirUrlImagem } from '@/lib/productImagesServer';
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
  const nomeTabelaRaw = slugToTabela(slug);
  console.log('Nome tabela decodificado:', nomeTabelaRaw);

  // Verificar se é item de tabela expandida (formato: tabela__id)
  const expandidoMatch = nomeTabelaRaw.match(/^(.+)__(\d+)$/);
  if (expandidoMatch) {
    const tabelaReal = expandidoMatch[1];
    const itemId = parseInt(expandidoMatch[2], 10);
    console.log(`Tabela expandida detectada: tabela="${tabelaReal}", itemId=${itemId}`);

    try {
      const { data, error } = await supabase
        .from(tabelaReal)
        .select('*')
        .eq('id', itemId)
        .single();

      if (!error && data) {
        // Buscar imagem da tabela de imagens
        let imagemUrl: string | null = null;
        try {
          const { data: imgData } = await supabase
            .from(`${tabelaReal}_imagens`)
            .select('url')
            .eq('produto_id', itemId)
            .order('ordem', { ascending: true })
            .limit(1);

          if (imgData && imgData.length > 0) {
            imagemUrl = corrigirUrlImagem(imgData[0].url);
          }
        } catch {
          console.log('Tabela de imagens não encontrada para expandido');
        }

        return {
          equipamento: {
            id: itemId,
            nome: data.nome,
            categoria: data.categoria || 'Equipamentos Médicos',
            codigo: data.codigo || null,
            descricao: data.descricao || null,
            imagem_url: imagemUrl || data.imagem_url || null,
          },
          nomeTabela: tabelaReal,
          isProdutoUnico: true,
        };
      }
    } catch (err) {
      console.error('Erro ao buscar item expandido:', err);
    }

    return { equipamento: null, nomeTabela: tabelaReal, isProdutoUnico: false };
  }

  const nomeTabela = nomeTabelaRaw;

  // Verificar se é equipamento de produto único
  const isProdutoUnico = isEquipamentoProdutoUnico(nomeTabela);
  console.log('É produto único:', isProdutoUnico);

  // Se for produto único, usar informações da categoria ao invés de buscar item individual
  if (isProdutoUnico) {
    console.log('Tratando como produto único - usando dados da categoria');

    // Buscar imagem da tabela de imagens
    let imagemUrl: string | null = null;
    const tabelaImagens = nomeTabela.replace(/ /g, '_').replace(/\+/g, '').replace(/\./g, '').toLowerCase() + '_imagens';

    try {
      const { data: imagemData } = await supabase
        .from(tabelaImagens.replace(/__/g, '_').replace(/_rf_pedal/, '_rf_pedal'))
        .select('url')
        .eq('ordem', 1)
        .limit(1);

      if (imagemData && imagemData.length > 0) {
        imagemUrl = corrigirUrlImagem(imagemData[0].url);
      }
    } catch {
      // Tentar nome alternativo da tabela de imagens
      try {
        const { data: imagemData } = await supabase
          .from('arthrocare_quantum_2_rf_pedal_imagens')
          .select('url')
          .eq('ordem', 1)
          .limit(1);

        if (imagemData && imagemData.length > 0) {
          imagemUrl = corrigirUrlImagem(imagemData[0].url);
        }
      } catch {
        console.log('Tabela de imagens não encontrada');
      }
    }

    // Buscar descrição combinando todos os itens da tabela
    let descricaoCompleta = '';
    try {
      const { data: itens } = await supabase
        .from(nomeTabela)
        .select('descricao')
        .limit(5);

      if (itens && itens.length > 0) {
        descricaoCompleta = itens
          .map((item: any) => item.descricao)
          .filter(Boolean)
          .join('\n\n');
      }
    } catch {
      console.log('Erro ao buscar descrições');
    }

    const nomeExibicao = tabelaToNomeExibicao(nomeTabela);

    return {
      equipamento: {
        id: 1,
        nome: nomeExibicao,
        categoria: 'Equipamentos Médicos',
        codigo: null,
        descricao: descricaoCompleta || `${nomeExibicao} - Equipamento médico de alta tecnologia disponível para locação.`,
        imagem_url: imagemUrl,
      },
      nomeTabela,
      isProdutoUnico: true,
    };
  }

  // Tenta buscar na tabela decodificada (fluxo normal)
  let equipamento = await getEquipamentoPorId(nomeTabela, id);

  if (equipamento) {
    console.log('Encontrado na tabela principal:', nomeTabela);
    return { equipamento, nomeTabela, isProdutoUnico: false };
  }

  console.log('Não encontrado na tabela principal, tentando fallback...');

  // Se não encontrou, tenta buscar em todas as tabelas de equipamentos
  // Ignora tabelas de produtos únicos no fallback (não fazem sentido para busca por ID)
  for (const tabela of TABELAS_EQUIPAMENTOS) {
    // Pular tabelas de produto único - elas não devem ser usadas em fallback
    if (isEquipamentoProdutoUnico(tabela)) {
      console.log(`Pulando tabela "${tabela}" (produto único)`);
      continue;
    }

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
      } else if (resultado.error?.code === '42703' || resultado.error?.code === 'PGRST116') {
        // Tabela não tem coluna 'id' ou não encontrou, buscar por índice
        console.log(`Tabela ${tabela} - buscando por índice...`);
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
        if (imagemUrl) imagemUrl = corrigirUrlImagem(imagemUrl);

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
          isProdutoUnico: false,
        };
      }
    } catch (err) {
      console.warn(`Erro ao buscar em ${tabela}:`, err);
    }
  }

  console.log('Não encontrado em nenhuma tabela');
  console.log('=== FIM DEBUG ===');
  return { equipamento: null, nomeTabela, isProdutoUnico: false };
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

  const { equipamento, nomeTabela, isProdutoUnico } = await buscarEquipamentoComFallback(slugDecodificado, equipamentoId);

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

  // Pré-carregar imagens dos produtos relacionados no servidor
  for (const relacionado of produtosRelacionados) {
    if (!relacionado.imagem_url) {
      try {
        const prodId = typeof relacionado.id === 'string' ? parseInt(relacionado.id, 10) : relacionado.id;
        if (!isNaN(prodId)) {
          const { data: imgData } = await getProductImagesServer(prodId, relacionado.caixa_tabela, relacionado.nome);
          if (imgData && imgData.length > 0) {
            const principal = imgData.find(img => img.principal) || imgData[0];
            if (principal?.url) {
              relacionado.imagem_url = principal.url;
            }
          }
        }
      } catch (err) {
        console.error(`[EquipamentoDetailPage] Erro ao pré-carregar imagem para "${relacionado.nome}":`, err);
      }
    }
  }

  // Pré-carregar imagens da galeria do equipamento principal
  let preloadedImages: { id?: string; url: string; ordem?: number; principal?: boolean }[] = [];
  try {
    const { data: imgData } = await getProductImagesServer(equipamento.id, nomeTabela, equipamento.nome);
    if (imgData && imgData.length > 0) {
      preloadedImages = imgData.map(img => ({
        id: img.id != null ? String(img.id) : undefined,
        url: img.url,
        ordem: img.ordem,
        principal: img.principal,
      }));
    }
  } catch (err) {
    console.error('[EquipamentoDetailPage] Erro ao pré-carregar imagens da galeria:', err);
  }

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
          preloadedImages={preloadedImages}
          isProdutoUnico={isProdutoUnico}
          totalItensCategoria={categoria?.total_itens || 0}
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
