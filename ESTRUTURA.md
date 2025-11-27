# Estrutura do Projeto PenseMed

## Árvore de Arquivos

```
C:\Users\danie\OneDrive\Documentos\Site Pense Med\
│
├── app/                                    # App Router do Next.js 14
│   ├── categorias/                         # Páginas de categorias
│   │   └── [slug]/                         # Rota dinâmica [equipamentos-medicos, instrumentacao-cirurgica-cme, opme]
│   │       ├── page.tsx                    # Página principal da categoria
│   │       └── loading.tsx                 # Estado de carregamento
│   │
│   ├── produtos/                           # Páginas de produtos
│   │   └── [slug]/                         # Rota dinâmica com slug do produto
│   │       ├── page.tsx                    # Página de detalhes do produto
│   │       └── loading.tsx                 # Estado de carregamento
│   │
│   ├── layout.tsx                          # Layout raiz (Navbar + Footer)
│   ├── page.tsx                            # Página inicial (Home)
│   ├── not-found.tsx                       # Página 404 personalizada
│   └── globals.css                         # Estilos globais do Tailwind
│
├── components/                             # Componentes React reutilizáveis
│   ├── CatalogWhatsAppCTA.tsx             # CTA do catálogo completo via WhatsApp
│   ├── Footer.tsx                          # Rodapé do site
│   ├── Navbar.tsx                          # Barra de navegação
│   ├── ProductCard.tsx                     # Card individual de produto
│   ├── ProductGrid.tsx                     # Grid de produtos com estado vazio
│   └── WhatsAppButton.tsx                  # Botão genérico do WhatsApp
│
├── lib/                                    # Bibliotecas e utilitários
│   ├── api.ts                             # Funções de acesso ao Supabase (getProdutos, etc.)
│   ├── supabaseClient.ts                  # Client configurado do Supabase
│   ├── types.ts                           # Tipos TypeScript (Produto, Categoria, etc.)
│   └── whatsapp.ts                        # Funções para gerar links do WhatsApp
│
├── supabase/                               # Configurações do banco
│   └── schema.sql                          # Schema da tabela produtos + exemplos
│
├── public/                                 # Arquivos estáticos (favicon, etc.)
│
├── .env.local.example                      # Exemplo de variáveis de ambiente
├── .gitignore                              # Arquivos ignorados pelo Git
├── next.config.js                          # Configuração do Next.js (imagens, etc.)
├── package.json                            # Dependências e scripts
├── postcss.config.js                       # Configuração do PostCSS
├── tailwind.config.js                      # Configuração do Tailwind CSS
├── tsconfig.json                           # Configuração do TypeScript
├── README.md                               # Documentação principal
└── ESTRUTURA.md                            # Este arquivo (estrutura detalhada)
```

## Descrição Detalhada dos Arquivos Principais

### App Router (`app/`)

#### `app/layout.tsx`
- **Propósito**: Layout global do site
- **Conteúdo**: Navbar + conteúdo dinâmico + Footer
- **Metadata**: SEO e tags meta
- **Font**: Configuração da fonte Inter

#### `app/page.tsx`
- **Propósito**: Página inicial (home)
- **Seções**:
  - Hero com título e CTAs
  - Grid de 3 categorias clicáveis
  - Seção de benefícios
  - CTA final de contato
- **Server Component**: Sim

#### `app/categorias/[slug]/page.tsx`
- **Propósito**: Página dinâmica de categoria
- **Rotas**: `/categorias/equipamentos-medicos`, `/categorias/instrumentacao-cirurgica-cme`, `/categorias/opme`
- **Funcionalidades**:
  - Busca produtos da Supabase por categoria
  - Renderiza grid de produtos
  - CTA de catálogo completo
  - Metadata dinâmica para SEO
  - Static Site Generation (SSG)
- **Server Component**: Sim

#### `app/produtos/[slug]/page.tsx`
- **Propósito**: Página de detalhes de um produto
- **Rota**: `/produtos/[slug-do-produto]`
- **Funcionalidades**:
  - Busca produto único por slug
  - Exibe imagem, descrições, características
  - CTA de orçamento via WhatsApp
  - Breadcrumb de navegação
  - Metadata dinâmica
- **Server Component**: Sim

#### `app/not-found.tsx`
- **Propósito**: Página 404 personalizada
- **Design**: Centralizada com link de retorno à home

### Componentes (`components/`)

#### `Navbar.tsx`
- Barra de navegação fixa no topo
- Logo "PenseMed"
- Links para Home e 3 categorias
- Responsivo (menu mobile placeholder)

#### `Footer.tsx`
- Rodapé com 3 colunas: Sobre, Links Rápidos, Contato
- Copyright dinâmico
- Links para categorias

#### `ProductCard.tsx`
- **Props**: `produto: Produto`
- Card visual de produto com:
  - Imagem (ou placeholder)
  - Código do produto
  - Nome
  - Descrição curta
  - Botão "Ver Detalhes"

#### `ProductGrid.tsx`
- **Props**: `produtos: Produto[]`
- Grid responsivo (1 col mobile, 2 tablet, 3 desktop)
- Estado vazio quando sem produtos

#### `CatalogWhatsAppCTA.tsx`
- **Props**: `nomeCategoria: string`
- CTA chamativo para solicitar catálogo completo
- Link do WhatsApp com mensagem pré-formatada
- Design com gradiente e ícones

#### `WhatsAppButton.tsx`
- **Props**: `href`, `label`, `variant`, `className`
- Botão reutilizável com ícone do WhatsApp
- 2 variantes: primary (verde) e secondary (branco com borda)

### Biblioteca (`lib/`)

#### `supabaseClient.ts`
- Client do Supabase configurado
- Valida variáveis de ambiente
- Exporta instância `supabase`

#### `api.ts`
- **`getProdutosByCategoria(categoria)`**: Busca produtos por nome da categoria
- **`getProdutoBySlug(slug)`**: Busca produto único
- **`getCategorias()`**: Lista categorias únicas
- **`getProdutosRecentes(limit)`**: Últimos produtos adicionados
- **`getProdutosByCategoriaSlug(slugCategoria)`**: Busca por slug de categoria
- Tratamento de erros e logs

#### `types.ts`
- Interface `Produto` com todos os campos da tabela
- Type `Categoria` (union type)
- Interface `CategoriaInfo` para metadados
- Objeto `CATEGORIAS_MAP` com slugs e informações
- Funções helper: `getCategoriaBySlug()`, `getCategoriaNameBySlug()`

#### `whatsapp.ts`
- **`getWhatsAppLink(message)`**: Gera link genérico
- **`getWhatsAppCatalogoLink(nomeCategoria)`**: Link para solicitar catálogo
- **`getWhatsAppProdutoLink(nomeProduto)`**: Link para solicitar orçamento
- **`getWhatsAppGenericLink()`**: Link genérico de contato

### Configurações

#### `package.json`
- **Dependências**:
  - `next@^14.1.0`
  - `react@^18.2.0`
  - `@supabase/supabase-js@^2.39.1`
- **DevDependencies**: TypeScript, Tailwind, ESLint
- **Scripts**: `dev`, `build`, `start`, `lint`, `type-check`

#### `tsconfig.json`
- Configuração TypeScript com modo estrito
- Path alias `@/*` para imports absolutos
- Compatível com App Router

#### `tailwind.config.js`
- Cores customizadas:
  - `medical`: Azul médico (#006bb3)
  - `medical-light`: Azul claro (#e8f4f8)
  - `medical-dark`: Azul escuro (#004d82)
- Paleta `primary` com gradientes

#### `next.config.js`
- Configuração de domínios de imagem para Supabase
- Pattern: `*.supabase.co/storage/v1/object/public/**`

#### `.env.local.example`
- Template de variáveis de ambiente
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

### Banco de Dados (`supabase/`)

#### `schema.sql`
- Criação da tabela `produtos`
- Índices para performance (categoria, slug, created_at)
- Trigger para `updated_at` automático
- Políticas RLS (Row Level Security):
  - Leitura pública
  - Inserção/atualização/deleção apenas autenticado
- 3 exemplos de inserção (um de cada categoria)
- Queries úteis comentadas

## Fluxo de Dados

1. **Usuário acessa uma categoria**
   - Next.js executa `app/categorias/[slug]/page.tsx` no servidor
   - Chama `getProdutosByCategoriaSlug(slug)` de `lib/api.ts`
   - Supabase retorna produtos da categoria
   - Página renderiza com `ProductGrid` e `CatalogWhatsAppCTA`

2. **Usuário clica em um produto**
   - Navega para `/produtos/[slug]`
   - Next.js executa `app/produtos/[slug]/page.tsx` no servidor
   - Chama `getProdutoBySlug(slug)` de `lib/api.ts`
   - Supabase retorna produto único
   - Página exibe detalhes completos

3. **Usuário clica em CTA do WhatsApp**
   - `getWhatsAppProdutoLink()` ou `getWhatsAppCatalogoLink()` gera URL
   - Link abre WhatsApp Web com mensagem pré-formatada

## Responsividade

- **Mobile (< 768px)**: 1 coluna
- **Tablet (768px - 1024px)**: 2 colunas
- **Desktop (> 1024px)**: 3 colunas

## Performance

- **SSG**: Categorias são geradas em build time (`generateStaticParams`)
- **ISR**: Produtos podem usar Incremental Static Regeneration
- **Image Optimization**: Next/Image com lazy loading
- **Loading States**: Skeletons para melhor UX

## SEO

- Metadata dinâmica em todas as páginas
- Títulos descritivos
- Descrições únicas por produto/categoria
- URLs amigáveis (slugs)
- Sitemap gerado automaticamente pelo Next.js

---

**Última atualização**: 2024
