import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getInstrumentoDaTabela, getCaixasCME, getProdutosRelacionados, getVariacoesInstrumento, TABELAS_CME, VariacaoInstrumento } from '@/lib/api';
import { slugToTabela, codigoValido, enriquecerDescricao } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import InstrumentoDetalhes from '@/components/InstrumentoDetalhes';

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

      // Se o código parece ser um ID numérico
      if (/^\d+$/.test(codigo)) {
        console.log(`Buscando por ID numérico: ${codigo}`);
        const resultado = await supabase
          .from(tabela)
          .select('*')
          .eq('id', parseInt(codigo, 10))
          .single();
        data = resultado.data;
      }

      // Se não encontrou por ID, tentar por código
      if (!data) {
        console.log(`Buscando por código: ${codigo}`);
        const resultado = await supabase
          .from(tabela)
          .select('*')
          .eq('codigo', codigo)
          .single();
        data = resultado.data;
      }

      // Se não encontrou por código e temos nome decodificado, buscar por nome
      if (!data && nomeDecodificado) {
        console.log(`Buscando por nome decodificado: ${nomeDecodificado}`);
        const resultado = await supabase
          .from(tabela)
          .select('*')
          .eq('nome', nomeDecodificado)
          .single();
        data = resultado.data;
      }

      if (data) {
        console.log('ENCONTRADO na tabela:', tabela);
        let imagemUrl = data.imagem_url || data.imagem || null;
        if (imagemUrl === 'NULL' || imagemUrl === 'null') imagemUrl = null;

        return {
          instrumento: {
            id: data.id,
            nome: data.nome,
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/" className="text-medical hover:text-medical-dark">
              Início
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href="/instrumentacao-cme"
              className="text-medical hover:text-medical-dark"
            >
              Instrumentação CME
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href={`/instrumentacao-cme/${params.categoria}`}
              className="text-medical hover:text-medical-dark"
            >
              {nomeExibicao}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 truncate max-w-[200px]">
              {mostrarCodigo ? instrumento.codigo : instrumento.nome}
            </span>
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                  href={`/instrumentacao-cme/${relacionado.caixa_slug}/${relacionado.id}`}
                  className="group bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
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
                href={`/instrumentacao-cme/${params.categoria}`}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
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
