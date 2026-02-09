import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getInstrumentoDaTabela, getCaixasCME, getProdutosRelacionados, getVariacoesInstrumento, TABELAS_CME, VariacaoInstrumento } from '@/lib/api';
import { slugToTabela, codigoValido, enriquecerDescricao } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import InstrumentoDetalhes from '@/components/InstrumentoDetalhes';
import ProdutoRelacionadoCard from '@/components/ProdutoRelacionadoCard';
import { getProductImagesServer } from '@/lib/productImagesServer';
import { GalleryImage } from '@/components/ImageGallery';

// ISR: revalidar a cada 5 minutos
export const revalidate = 300;

interface InstrumentoDetailPageProps {
  params: {
    categoria: string;
    codigo: string;
  };
}

/**
 * Busca instrumento tentando diferentes métodos e tabelas se necessário
 */
async function buscarInstrumentoComFallback(slug: string, codigo: string) {
  console.log('=== DEBUG BUSCA INSTRUMENTO CME ===');
  console.log('Slug recebido:', slug);
  console.log('Código:', codigo);

  // Primeiro tenta decodificar o slug
  const nomeTabela = slugToTabela(slug);
  console.log('Nome tabela decodificado:', nomeTabela);

  // Tenta buscar na tabela decodificada
  let instrumento = await getInstrumentoDaTabela(nomeTabela, codigo);

  if (instrumento) {
    console.log('Encontrado na tabela principal:', nomeTabela);
    return { instrumento, nomeTabela };
  }

  console.log('Não encontrado na tabela principal, tentando fallback...');

  // Tentar decodificar o código se parece ser base64url (nome codificado)
  let nomeDecodificado: string | null = null;
  if (codigo.length > 20 && !/^\d+$/.test(codigo)) {
    try {
      nomeDecodificado = Buffer.from(codigo, 'base64url').toString('utf-8');
      console.log('Nome decodificado do código:', nomeDecodificado);
    } catch {
      console.log('Código não é base64url válido');
    }
  }

  // Se não encontrou, tenta buscar em todas as tabelas CME
  for (const tabela of TABELAS_CME) {
    console.log('Tentando tabela:', tabela);
    try {
      let data: any = null;
      let idUsado: number | null = null;

      // Se o código parece ser um ID numérico
      if (/^\d+$/.test(codigo)) {
        const idBuscado = parseInt(codigo, 10);
        console.log(`Buscando por ID numérico: ${idBuscado}`);

        // Primeiro tentar buscar por coluna 'id'
        const resultado = await supabase
          .from(tabela)
          .select('*')
          .eq('id', idBuscado)
          .single();

        if (!resultado.error && resultado.data) {
          data = resultado.data;
          idUsado = data.id;
        } else if (resultado.error?.code === '42703') {
          // Tabela não tem coluna 'id', buscar por índice
          console.log(`Tabela ${tabela} não tem coluna id, buscando por índice...`);
          const { data: allData, error: allError } = await supabase
            .from(tabela)
            .select('*')
            .order('nome', { ascending: true });

          if (!allError && allData) {
            const idxBuscado = idBuscado - 1;
            if (idxBuscado >= 0 && idxBuscado < allData.length) {
              data = allData[idxBuscado];
              idUsado = idBuscado;
            }
          }
        }
      }

      // Se não encontrou por ID, tentar por código
      if (!data) {
        console.log(`Buscando por código: ${codigo}`);
        const resultado = await supabase
          .from(tabela)
          .select('*')
          .eq('codigo', codigo)
          .single();
        if (!resultado.error) {
          data = resultado.data;
          idUsado = data?.id;
        }
      }

      // Se não encontrou por código e temos nome decodificado, buscar por nome
      if (!data && nomeDecodificado) {
        console.log(`Buscando por nome decodificado: ${nomeDecodificado}`);
        const resultado = await supabase
          .from(tabela)
          .select('*')
          .eq('nome', nomeDecodificado)
          .single();
        if (!resultado.error) {
          data = resultado.data;
          idUsado = data?.id;
        }
      }

      if (data) {
        console.log('ENCONTRADO na tabela:', tabela);
        let imagemUrl = data.imagem_url || data.imagem || null;
        if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

        return {
          instrumento: {
            id: idUsado || data.id || parseInt(codigo, 10),
            nome: data.nome,
            nome_original: data.nome,
            codigo: data.codigo || null,
            descricao: data.descricao || null,
            imagem_url: imagemUrl,
            categoria: tabela,
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
  return { instrumento: null, nomeTabela };
}

export async function generateMetadata({
  params,
}: InstrumentoDetailPageProps): Promise<Metadata> {
  const { instrumento, nomeTabela } = await buscarInstrumentoComFallback(params.categoria, params.codigo);

  if (!instrumento) {
    return {
      title: 'Instrumento não encontrado - PenseMed',
    };
  }

  // Buscar caixa para obter nome de exibição
  const caixas = await getCaixasCME();
  const caixa = caixas.find(c => c.nome_tabela === nomeTabela);
  const nomeExibicao = caixa?.nome_exibicao || instrumento.categoria;

  const codigoDisplay = codigoValido(instrumento.codigo) ? ` - ${instrumento.codigo}` : '';

  return {
    title: `${instrumento.nome}${codigoDisplay} | ${nomeExibicao} | PenseMed`,
    description: instrumento.descricao || `${instrumento.nome} - Instrumento cirúrgico da ${nomeExibicao}`,
  };
}

export default async function InstrumentoDetailPage({
  params,
}: InstrumentoDetailPageProps) {
  const { instrumento, nomeTabela } = await buscarInstrumentoComFallback(params.categoria, params.codigo);

  if (!instrumento) {
    console.error('[InstrumentoDetailPage] Instrumento não encontrado após fallback');
    notFound();
  }

  // Buscar caixa para obter nome de exibição
  const caixas = await getCaixasCME();
  const caixa = caixas.find(c => c.nome_tabela === nomeTabela);

  if (!caixa) {
    console.warn('[InstrumentoDetailPage] Caixa não encontrada para tabela:', nomeTabela);
  }

  const nomeExibicao = caixa?.nome_exibicao || instrumento.categoria || 'Instrumentação CME';

  // Verificar se o código é válido para exibição
  const mostrarCodigo = codigoValido(instrumento.codigo);

  // Enriquecer descrição se for curta
  const descricaoCompleta = enriquecerDescricao(
    instrumento.descricao,
    instrumento.nome,
    nomeExibicao
  );

  // Buscar variações do instrumento
  let variacoes: VariacaoInstrumento[] = [];
  if (instrumento.id) {
    variacoes = await getVariacoesInstrumento(nomeTabela, instrumento.id);
    console.log(`[InstrumentoDetailPage] Variações encontradas: ${variacoes.length}`);
  }

  // Buscar produtos relacionados
  const produtosRelacionados = await getProdutosRelacionados(
    nomeTabela,
    instrumento.id || params.codigo,
    'Instrumentação Cirúrgica CME',
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
        console.error(`[InstrumentoDetailPage] Erro ao pré-carregar imagem relacionado "${relacionado.nome}":`, err);
      }
    }
  }

  // Pré-carregar imagens do produto no servidor para evitar chamadas client-side ao Supabase
  let preloadedImages: GalleryImage[] = [];
  try {
    const productId = instrumento.id || 0;
    const { data: imgData } = await getProductImagesServer(productId, nomeTabela, instrumento.nome_original || instrumento.nome);
    if (imgData && imgData.length > 0) {
      preloadedImages = imgData.map((img: any) => ({
        id: img.id,
        url: img.url,
        ordem: img.ordem,
        principal: img.principal,
      }));
    }
  } catch (err) {
    console.error('[InstrumentoDetailPage] Erro ao pré-carregar imagens:', err);
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
              href="/instrumentacao-cme"
              className="hover:text-gray-700 transition-colors"
            >
              Instrumentação CME
            </Link>
            <span>/</span>
            <Link
              href={`/instrumentacao-cme/${params.categoria}`}
              className="hover:text-gray-700 transition-colors"
            >
              {nomeExibicao}
            </Link>
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        <InstrumentoDetalhes
          instrumento={{
            id: instrumento.id,
            nome: instrumento.nome,
            codigo: instrumento.codigo,
            descricao: instrumento.descricao,
            imagem_url: instrumento.imagem_url,
          }}
          variacoes={variacoes}
          nomeExibicao={nomeExibicao}
          categoriaSlug={params.categoria}
          descricaoCompleta={descricaoCompleta}
          mostrarCodigo={mostrarCodigo}
          nomeTabela={nomeTabela}
          preloadedImages={preloadedImages}
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
                />
              ))}
            </div>

            {/* Botão ver mais */}
            <div className="text-center mt-8">
              <Link
                href={`/instrumentacao-cme/${params.categoria}`}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Ver mais produtos desta caixa
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
