# Início Rápido - PenseMed

Guia rápido para colocar o projeto no ar em 10 minutos.

## Passo 1: Instalar Dependências (1 min)

```bash
npm install
```

## Passo 2: Configurar Supabase (3 min)

### 2.1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Preencha nome, senha do banco e região
5. Aguarde a criação (1-2 minutos)

### 2.2. Criar a Tabela
1. No dashboard do Supabase, vá em **SQL Editor**
2. Cole o conteúdo completo do arquivo `supabase/schema.sql`
3. Clique em **Run** (ou F5)
4. Sucesso! A tabela `produtos` foi criada

### 2.3. Criar o Bucket de Storage
1. No dashboard do Supabase, vá em **Storage**
2. Clique em **New bucket**
3. Nome: `produtos`
4. Marque **Public bucket** ✅
5. Clique em **Create bucket**

## Passo 3: Configurar Variáveis de Ambiente (2 min)

### 3.1. Criar arquivo `.env.local`
```bash
cp .env.local.example .env.local
```

### 3.2. Obter credenciais do Supabase
1. No dashboard do Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3.3. Editar `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

**Formato do WhatsApp**: 55 (país) + DDD + número (ex: 5511999999999)

## Passo 4: Inserir Produtos de Exemplo (2 min)

### Opção A: Pelo SQL Editor (Recomendado)
1. Vá em **SQL Editor** no Supabase
2. Use os exemplos que já estão no arquivo `supabase/schema.sql`
3. Execute as queries de INSERT
4. Pronto! Você tem 3 produtos de exemplo

### Opção B: Pelo Table Editor
1. Vá em **Table Editor** → `produtos` no Supabase
2. Clique em **Insert** → **Insert row**
3. Preencha os campos manualmente
4. **Importante**: Para `imagem_url`, use uma URL de imagem temporária ou faça upload no bucket primeiro

**URLs de imagem temporárias para teste:**
```
https://placehold.co/600x400/006bb3/white?text=Produto+1
https://placehold.co/600x400/006bb3/white?text=Produto+2
https://placehold.co/600x400/006bb3/white?text=Produto+3
```

## Passo 5: Rodar o Projeto (1 min)

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## Verificar se Está Funcionando

### ✅ Checklist
- [ ] Página inicial abre sem erros
- [ ] 3 categorias aparecem na home
- [ ] Ao clicar em uma categoria, abre a página de catálogo
- [ ] Produtos aparecem no catálogo (se você inseriu)
- [ ] Ao clicar em "Ver Detalhes", abre a página do produto
- [ ] Botão do WhatsApp abre o app/web do WhatsApp

### ❌ Problemas Comuns

**Erro: "Supabase URL não configurada"**
- Verifique se o arquivo `.env.local` existe
- Verifique se as variáveis estão corretas (sem espaços extras)
- Reinicie o servidor (`Ctrl+C` e `npm run dev` novamente)

**Nenhum produto aparece**
- Verifique se você inseriu produtos na tabela
- Verifique se a categoria do produto está exatamente como: `"Equipamentos Médicos"`, `"Instrumentação Cirúrgica CME"` ou `"OPME"`
- Abra o console do navegador (F12) e veja se há erros

**Imagens não aparecem**
- Verifique se o bucket `produtos` está marcado como público
- Verifique se a URL da imagem está correta
- Use as URLs de placeholder temporárias para testar

## Próximos Passos

### 1. Adicionar Suas Imagens
1. Vá em **Storage** → `produtos` no Supabase
2. Clique em **Upload file**
3. Faça upload das fotos dos produtos
4. Clique na imagem → **Copy URL**
5. Atualize o campo `imagem_url` na tabela

### 2. Adicionar Seus Produtos
Use o SQL Editor com este template:

```sql
INSERT INTO produtos (
    categoria,
    nome,
    slug,
    descricao_curta,
    aplicacao,
    descricao_tecnica,
    caracteristicas_beneficios,
    codigo_produto,
    imagem_url
) VALUES (
    'Equipamentos Médicos',
    'Nome do Produto',
    'nome-do-produto',
    'Descrição curta aqui',
    'Onde é usado',
    'Especificações técnicas',
    'Benefício 1
Benefício 2
Benefício 3',
    'PROD-001',
    'https://seu-projeto.supabase.co/storage/v1/object/public/produtos/imagem.jpg'
);
```

**Dica para gerar slugs**:
- Tire acentos e caracteres especiais
- Coloque tudo em minúsculas
- Troque espaços por hífen
- Ex: "Monitor Multiparâmetros" → "monitor-multiparametros"

### 3. Personalizar o Site

**Cores** (`tailwind.config.js`):
```js
colors: {
  medical: {
    light: '#e8f4f8',    // Azul claro
    DEFAULT: '#006bb3',  // Azul médico
    dark: '#004d82',     // Azul escuro
  }
}
```

**Textos da Home** (`app/page.tsx`):
- Edite o título, subtítulo e descrições

**Rodapé** (`components/Footer.tsx`):
- Adicione informações de contato reais

## Deploy Rápido na Vercel (5 min)

1. Crie uma conta em [vercel.com](https://vercel.com)
2. Clique em **Add New** → **Project**
3. Importe o repositório Git (GitHub/GitLab/Bitbucket)
4. Configure as variáveis de ambiente (mesmas do `.env.local`)
5. Clique em **Deploy**
6. Pronto! Site no ar em minutos

**URL do site**: `https://seu-projeto.vercel.app`

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção (para testar antes do deploy)
npm run build
npm run start

# Verificar tipos TypeScript
npm run type-check

# Verificar código (linter)
npm run lint
```

## Ajuda

**Precisa de ajuda?** Verifique:
- `README.md` - Documentação completa
- `ESTRUTURA.md` - Entenda a estrutura do projeto
- Supabase Dashboard → Logs - Veja erros do banco
- Console do navegador (F12) - Veja erros do frontend

---

**Desenvolvido para PenseMed** 🏥
