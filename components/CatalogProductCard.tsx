'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProdutoCatalogo } from '@/lib/api';
import { getWhatsAppProdutoLink } from '@/lib/whatsapp';
import { codigoValido, getProdutoRedirect } from '@/lib/instrumentUtils';

const PLACEHOLDER_IMAGE = '/images/placeholder-produto.svg';

// Função para gerar URL do produto
// O id composto tem formato: "tipo-nometabela-ID" (ex: "cme-caixa cervical translucente-5")
// IMPORTANTE: O ID está sempre após o último hífen
function getProductUrl(produto: ProdutoCatalogo): string {
  // Extrair o ID numérico real - está após o último hífen do id composto
  const partes = produto.id.split('-');
  const idNumerico = partes[partes.length - 1];

  // Verificar se o produto deve ser redirecionado para outra caixa
  const redirect = getProdutoRedirect(produto.nome);
  const caixaSlug = redirect ? redirect.slug : produto.caixa_slug;

  if (produto.categoria_principal === 'Equipamentos Médicos') {
    return `/equipamentos-medicos/${produto.caixa_slug}/${idNumerico}`;
  } else if (produto.categoria_principal === 'OPME') {
    return `/categorias/opme/${idNumerico}`;
  } else {
    return `/instrumentacao-cme/${caixaSlug}/${idNumerico}`;
  }
}

interface CatalogProductCardProps {
  produto: ProdutoCatalogo;
}

export default function CatalogProductCard({ produto }: CatalogProductCardProps) {
  // Imagem é pré-carregada server-side - não fazer fetch client-side (falha em produção Vercel)
  const imagemUrl = produto.imagem_url || null;
  const [imageError, setImageError] = useState(false);

  const whatsappLink = getWhatsAppProdutoLink(produto.nome);
  const productUrl = getProductUrl(produto);

  return (
    <Link
      href={productUrl}
      className="group bg-white rounded-lg sm:rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 block"
    >
      {/* Imagem */}
      <div className="aspect-square relative overflow-hidden bg-white">
        {imagemUrl && !imageError ? (
          <Image
            src={imagemUrl}
            alt={produto.nome}
            fill
            className="object-contain p-2 sm:p-4 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <Image
            src={PLACEHOLDER_IMAGE}
            alt={produto.nome}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
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
