'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProdutoCatalogo } from '@/lib/api';
import { getWhatsAppProdutoLink } from '@/lib/whatsapp';
import { codigoValido } from '@/lib/instrumentUtils';
import { getProductImages, getOPMEProductImages } from '@/hooks/useProductImages';

// Função para gerar URL do produto
// O id composto tem formato: "tipo-nometabela-ID" (ex: "cme-caixa cervical translucente-5")
// IMPORTANTE: O ID está sempre após o último hífen
function getProductUrl(produto: ProdutoCatalogo): string {
  // Extrair o ID numérico real - está após o último hífen do id composto
  const partes = produto.id.split('-');
  const idNumerico = partes[partes.length - 1];

  if (produto.categoria_principal === 'Equipamentos Médicos') {
    return `/equipamentos-medicos/${produto.caixa_slug}/${idNumerico}`;
  } else if (produto.categoria_principal === 'OPME') {
    return `/categorias/opme/${idNumerico}`;
  } else {
    return `/instrumentacao-cme/${produto.caixa_slug}/${idNumerico}`;
  }
}

interface CatalogProductCardProps {
  produto: ProdutoCatalogo;
}

export default function CatalogProductCard({ produto }: CatalogProductCardProps) {
  const [imagemUrl, setImagemUrl] = useState<string | null>(produto.imagem_url || null);
  const [loading, setLoading] = useState(true);

  const whatsappLink = getWhatsAppProdutoLink(produto.nome);
  const productUrl = getProductUrl(produto);

  useEffect(() => {
    const fetchImage = async () => {
      // Extrair o ID numérico do id composto - está após o último hífen
      const partes = produto.id.split('-');
      const idString = partes[partes.length - 1];
      const productId = /^\d+$/.test(idString) ? parseInt(idString, 10) : null;

      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        // Para produtos OPME, usar função específica
        if (produto.categoria_principal === 'OPME') {
          const { data, error } = await getOPMEProductImages(productId);
          if (!error && data && data.length > 0) {
            // Usa a primeira imagem (ordem = 0) ou a primeira disponível
            const imagemPrincipal = data.find(img => img.ordem === 0) || data[0];
            if (imagemPrincipal?.url) {
              setImagemUrl(imagemPrincipal.url);
            }
          }
        } else if (produto.caixa_tabela) {
          // Para CME e Equipamentos, usar função padrão
          const { data, error } = await getProductImages(productId, produto.caixa_tabela, produto.nome);

          if (!error && data && data.length > 0) {
            // Usa a imagem principal ou a primeira
            const imagemPrincipal = data.find(img => img.principal) || data[0];
            if (imagemPrincipal?.url) {
              setImagemUrl(imagemPrincipal.url);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar imagem do produto:', err);
      }

      setLoading(false);
    };

    fetchImage();
  }, [produto.id, produto.caixa_tabela, produto.categoria_principal, produto.nome]);

  return (
    <Link
      href={productUrl}
      className="group bg-white rounded-lg sm:rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 block"
    >
      {/* Imagem */}
      <div className="aspect-square relative overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-200 border-t-[#205b67] rounded-full animate-spin" />
          </div>
        ) : imagemUrl ? (
          <Image
            src={imagemUrl}
            alt={produto.nome}
            fill
            className="object-contain p-2 sm:p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-10 h-10 sm:w-16 sm:h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Badge categoria */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
          <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${
            produto.categoria_principal === 'Equipamentos Médicos'
              ? 'bg-[#2a7a8a]/15 text-[#2a7a8a]'
              : produto.categoria_principal === 'OPME'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-[#205b67]/15 text-[#205b67]'
          }`}>
            {produto.categoria_principal === 'Equipamentos Médicos' ? 'Equipamento' : produto.categoria_principal === 'OPME' ? 'OPME' : 'CME'}
          </span>
        </div>
        {/* Botão WhatsApp - visível em mobile, hover em desktop */}
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(whatsappLink, '_blank');
          }}
          className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-10 sm:h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 hover:bg-[#20bd5a] shadow-lg cursor-pointer"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </span>
      </div>

      {/* Info */}
      <div className="p-2 sm:p-4">
        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 mb-0.5 sm:mb-1 group-hover:text-[#205b67] transition-colors">
          {produto.nome}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2 line-clamp-1">{produto.caixa_nome}</p>
        {produto.codigo && codigoValido(produto.codigo) && (
          <p className="text-[10px] sm:text-xs text-gray-400 truncate">Cód: {produto.codigo}</p>
        )}
      </div>
    </Link>
  );
}
