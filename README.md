# PenseMed - Website de Locação de Equipamentos Médicos

Website completo desenvolvido em Next.js 14 para a PenseMed, especializada em locação de equipamentos médicos, instrumentação cirúrgica CME e OPME.

## Tecnologias Utilizadas

- **Next.js 14** com App Router
- **TypeScript** para tipagem forte
- **Tailwind CSS** para estilização
- **Supabase** para banco de dados e storage
- **React** 18
- **Next/Image** para otimização de imagens

## Estrutura do Projeto

```
pensemed-website/
├── app/                          # App Router (Next.js 14)
│   ├── categorias/
│   │   └── [slug]/
│   │       ├── page.tsx         # Página dinâmica de categoria
│   │       └── loading.tsx      # Loading state
│   ├── produtos/
│   │   └── [slug]/
│   │       ├── page.tsx         # Página dinâmica de produto
│   │       └── loading.tsx      # Loading state
│   ├── layout.tsx               # Layout global
│   ├── page.tsx                 # Página inicial
│   └── globals.css              # Estilos globais
├── components/                   # Componentes reutilizáveis
│   ├── CatalogWhatsAppCTA.tsx   # CTA de catálogo WhatsApp
│   ├── Footer.tsx               # Rodapé
│   ├── Navbar.tsx               # Barra de navegação
│   ├── ProductCard.tsx          # Card de produto
│   ├── ProductGrid.tsx          # Grid de produtos
│   └── WhatsAppButton.tsx       # Botão WhatsApp genérico
├── lib/                          # Utilitários e configurações
│   ├── api.ts                   # Funções de acesso aos dados
│   ├── supabaseClient.ts        # Cliente Supabase
│   ├── types.ts                 # Tipos TypeScript
│   └── whatsapp.ts              # Utilitários WhatsApp
├── supabase/
│   └── schema.sql               # Schema do banco de dados
├── public/                       # Arquivos estáticos
├── .env.local.example           # Exemplo de variáveis de ambiente
├── next.config.js               # Configuração Next.js
├── tailwind.config.js           # Configuração Tailwind
├── tsconfig.json                # Configuração TypeScript
└── package.json                 # Dependências
```

## Funcionalidades

### Catálogo Dinâmico
- **3 Categorias principais**: Equipamentos Médicos, Instrumentação Cirúrgica CME, OPME
- Produtos carregados dinamicamente da Supabase
- Filtros por categoria
- Sistema de busca otimizado

### Páginas de Produto
- Detalhes completos do produto
- Imagens otimizadas com Next/Image
- Informações técnicas completas
- Características e benefícios
- Itens inclusos
- Códigos ANVISA e do produto

### CTAs de WhatsApp
- Botão para solicitar catálogo completo por categoria
- Botão para orçamento específico de produto
- Links pré-formatados com mensagens personalizadas

### Performance e SEO
- Static Site Generation (SSG) para páginas de categoria
- Metadata dinâmica para SEO
- Imagens otimizadas e lazy loading
- Loading states para melhor UX

## Configuração e Instalação

### 1. Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Projeto criado no Supabase

### 2. Clonar e Instalar Dependências

```bash
# Instalar dependências
npm install
```

### 3. Configurar Supabase

#### 3.1. Criar a Tabela no Supabase

1. Acesse o dashboard do Supabase
2. Vá em **SQL Editor**
3. Execute o script `supabase/schema.sql`
4. Isso criará a tabela `produtos` com todos os índices e políticas RLS

#### 3.2. Criar Bucket de Storage

1. No dashboard do Supabase, vá em **Storage**
2. Crie um novo bucket chamado `produtos`
3. Configure o bucket como **público**
4. Faça upload das imagens dos produtos

### 4. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.local.example .env.local
```

2. Edite `.env.local` com suas credenciais:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui

# WhatsApp Configuration (formato: 55DDD999999999)
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

**Como encontrar suas credenciais Supabase:**
1. Dashboard do Supabase → Settings → API
2. Copie o **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
3. Copie a **anon/public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 5. Rodar o Projeto

```bash
# Modo desenvolvimento
npm run dev

# O site estará disponível em http://localhost:3000
```

## Inserindo Produtos

### Manualmente via Supabase Dashboard

1. Acesse o dashboard do Supabase
2. Vá em **Table Editor** → `produtos`
3. Clique em **Insert row**
4. Preencha os campos (veja exemplos no `schema.sql`)

### Via SQL

Execute queries SQL no SQL Editor do Supabase (veja exemplos no arquivo `supabase/schema.sql`).

### Formato das URLs de Imagens

As imagens devem estar no formato:
```
https://seu-projeto.supabase.co/storage/v1/object/public/produtos/nome-da-imagem.jpg
```

**Para obter a URL pública de uma imagem:**
1. Supabase Dashboard → Storage → produtos
2. Faça upload da imagem
3. Clique na imagem
4. Copie a URL pública

## Estrutura de Dados

### Tabela `produtos`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | ID único (gerado automaticamente) |
| `categoria` | TEXT | Sim | "Equipamentos Médicos", "Instrumentação Cirúrgica CME" ou "OPME" |
| `nome` | TEXT | Sim | Nome do produto |
| `slug` | TEXT | Sim | URL amigável (único, ex: "monitor-multiparametros") |
| `descricao_curta` | TEXT | Sim | Descrição resumida |
| `aplicacao` | TEXT | Não | Onde/como o produto é usado |
| `descricao_tecnica` | TEXT | Não | Especificações técnicas |
| `caracteristicas_beneficios` | TEXT | Não | Lista separada por `\n` ou `;` |
| `itens_inclusos` | TEXT | Não | Lista de itens inclusos |
| `preco_referencia` | TEXT | Não | Texto informativo sobre preço |
| `codigo_anvisa` | TEXT | Não | Registro ANVISA |
| `codigo_produto` | TEXT | Não | Código interno |
| `imagem_url` | TEXT | Sim | URL da imagem no Supabase Storage |
| `created_at` | TIMESTAMP | Sim | Data de criação (automático) |
| `updated_at` | TIMESTAMP | Sim | Data de atualização (automático) |

## Deploy

### Deploy na Vercel (Recomendado)

1. Faça push do código para um repositório Git (GitHub, GitLab, Bitbucket)

2. Acesse [vercel.com](https://vercel.com) e faça login

3. Clique em **Add New Project**

4. Importe seu repositório

5. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`

6. Clique em **Deploy**

### Build para Produção (Local)

```bash
# Criar build de produção
npm run build

# Rodar build localmente
npm run start
```

## Rotas do Site

| Rota | Descrição |
|------|-----------|
| `/` | Página inicial com hero e categorias |
| `/categorias/equipamentos-medicos` | Catálogo de equipamentos médicos |
| `/categorias/instrumentacao-cirurgica-cme` | Catálogo de instrumentação CME |
| `/categorias/opme` | Catálogo de OPME |
| `/produtos/[slug]` | Página de detalhes do produto |

## Customização

### Cores

As cores principais estão configuradas em `tailwind.config.js`:
- `medical`: Azul médico principal
- `medical-light`: Azul claro
- `medical-dark`: Azul escuro

### WhatsApp

Para alterar o número do WhatsApp, edite a variável `NEXT_PUBLIC_WHATSAPP_NUMBER` no `.env.local`.

### Categorias

Para adicionar/modificar categorias, edite o objeto `CATEGORIAS_MAP` em `lib/types.ts`.

## Scripts Disponíveis

```bash
npm run dev        # Inicia servidor de desenvolvimento
npm run build      # Cria build de produção
npm run start      # Inicia servidor de produção
npm run lint       # Executa linter
npm run type-check # Verifica tipos TypeScript
```

## Suporte e Manutenção

### Verificar Logs

- **Desenvolvimento**: Logs aparecem no terminal onde rodou `npm run dev`
- **Produção (Vercel)**: Dashboard da Vercel → seu projeto → Logs

### Problemas Comuns

**Erro: "Supabase URL e/ou Anon Key não configurados"**
- Verifique se o arquivo `.env.local` existe e está preenchido corretamente

**Imagens não aparecem**
- Verifique se o bucket `produtos` está público
- Confirme se a URL da imagem está correta
- Verifique o `next.config.js` para padrões de domínio de imagem

**Produtos não aparecem**
- Verifique se a tabela foi criada corretamente
- Confirme se há produtos inseridos na tabela
- Verifique as políticas RLS no Supabase

## Licença

Projeto proprietário - PenseMed © 2024

---

**Desenvolvido com Next.js 14, TypeScript e Tailwind CSS**
