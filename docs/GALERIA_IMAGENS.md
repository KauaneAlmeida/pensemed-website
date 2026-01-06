# Sistema de Galeria de Imagens - Documentação

## Estrutura do Banco de Dados

### Tabela de Produtos (exemplo: `afastador abdominal all path – omni tract`)
| Coluna    | Tipo   | Descrição                |
|-----------|--------|--------------------------|
| id        | int8   | PK                       |
| categoria | text   | Categoria do produto     |
| codigo    | text   | Código (ex: ASL500)      |
| nome      | text   | Nome do produto          |
| descricao | text   | Descrição                |

### Tabela de Imagens (exemplo: `afastador_abdominal_all_path_imagens`)
| Coluna     | Tipo      | Descrição                           |
|------------|-----------|-------------------------------------|
| id         | uuid      | PK                                  |
| produto_id | int       | FK para tabela de produtos          |
| url        | text      | URL completa da imagem no storage   |
| ordem      | int4      | Ordem de exibição (1, 2, 3...)      |
| principal  | boolean   | Se é a imagem principal do produto  |
| created_at | timestamp | Data de criação                     |

## Componentes Disponíveis

### 1. `ImageGallery` - Galeria Básica
```tsx
import ImageGallery from '@/components/ImageGallery';

<ImageGallery
  images={[
    { url: 'https://...', principal: true, ordem: 1 },
    { url: 'https://...', principal: false, ordem: 2 },
  ]}
  productName="Nome do Produto"
  showArrows={true}
  showIndicators={true}
  enableZoom={true}
/>
```

### 2. `ImageGalleryCompact` - Para Cards de Listagem
```tsx
import { ImageGalleryCompact } from '@/components/ImageGallery';

<ImageGalleryCompact
  images={images}
  productName="Nome do Produto"
/>
```

### 3. `ImageGalleryFull` - Para Página de Detalhes
```tsx
import { ImageGalleryFull } from '@/components/ImageGallery';

<ImageGalleryFull
  images={images}
  productName="Nome do Produto"
/>
```

### 4. `ProductCardWithGallery` - Card com Fetch Automático
```tsx
import ProductCardWithGallery from '@/components/ProductCardWithGallery';

<ProductCardWithGallery
  produto={{
    id: 1,
    nome: "Afastador Abdominal",
    codigo: "ASL500",
    descricao: "Descrição...",
    imagem_url: null, // fallback se não encontrar na tabela de imagens
  }}
  nomeTabela="afastador abdominal all path – omni tract"
  href="/instrumentacao-cme/categoria/1"
  showWhatsApp={true}
/>
```

## Hook para Buscar Imagens

```tsx
import { useProductImages, getProductImages } from '@/hooks/useProductImages';

// Com Hook (para componentes client)
function MeuComponente({ productId, tableName }) {
  const { images, mainImage, loading, hasImages } = useProductImages(productId, tableName);

  if (loading) return <Skeleton />;

  return <ImageGallery images={images} productName="..." />;
}

// Sem Hook (para fetch assíncrono)
async function buscarImagens() {
  const { data, error } = await getProductImages(1, 'afastador abdominal all path – omni tract');
  console.log(data); // Array de imagens
}
```

## Funções da API

```tsx
import { getProdutoComImagens, getProdutosComImagemPrincipal } from '@/lib/api';

// Buscar produto único com todas as imagens
const produto = await getProdutoComImagens(
  'afastador abdominal all path – omni tract',
  1 // produto_id
);
// Retorna:
// {
//   id: 1,
//   nome: "...",
//   descricao: "...",
//   imagemPrincipal: "https://...",
//   galeriaDeImagens: [{ id, url, ordem, principal }, ...]
// }

// Buscar múltiplos produtos com imagem principal
const produtos = await getProdutosComImagemPrincipal(
  'afastador abdominal all path – omni tract',
  20 // limite
);
```

## Mapeamento de Tabelas

O mapeamento de tabelas de produtos para tabelas de imagens está em:
- `lib/api.ts` -> `MAPEAMENTO_TABELAS_IMAGENS`
- `hooks/useProductImages.ts` -> `getImageTableName()`

Padrão de nomenclatura:
- Tabela de produtos: `afastador abdominal all path – omni tract`
- Tabela de imagens: `afastador_abdominal_all_path_imagens`

## Recursos dos Componentes

### Galeria de Cards
- ✅ Navegação por setas (← →)
- ✅ Indicadores de paginação (bolinhas)
- ✅ Zoom no hover (scale 1.1)
- ✅ Suporte a swipe em mobile
- ✅ Navegação por teclado (quando hover)
- ✅ Badge de contagem de imagens

### Galeria de Detalhes
- ✅ Imagem principal grande
- ✅ Miniaturas clicáveis
- ✅ Badge "Principal" na miniatura
- ✅ Zoom no hover

## Exemplo de Integração Completa

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getProdutoComImagens, ProdutoComImagens } from '@/lib/api';
import ProdutoComGaleria from '@/components/ProdutoComGaleria';

export default function PaginaProduto({ params }: { params: { id: string } }) {
  const [produto, setProduto] = useState<ProdutoComImagens | null>(null);

  useEffect(() => {
    getProdutoComImagens('afastador abdominal all path – omni tract', parseInt(params.id))
      .then(setProduto);
  }, [params.id]);

  if (!produto) return <Loading />;

  return <ProdutoComGaleria produto={produto} />;
}
```

## URLs das Imagens no Storage

Formato:
```
https://lrasuvrzyzmmjumxrhzv.supabase.co/storage/v1/object/public/instrumentos/{pasta-do-produto}/{arquivo}.jpg
```

Exemplo:
```
https://lrasuvrzyzmmjumxrhzv.supabase.co/storage/v1/object/public/instrumentos/afastador-abdominal-all-path/01.jpg
```
