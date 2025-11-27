# Comandos Úteis - PenseMed

Referência rápida de comandos para desenvolvimento e manutenção do projeto.

---

## 🚀 Desenvolvimento

### Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse: http://localhost:3000

### Build de Produção
```bash
npm run build
```
Gera build otimizado na pasta `.next/`

### Iniciar em Produção (Local)
```bash
npm run build
npm run start
```
Testa build de produção antes do deploy

---

## ✅ Verificações

### Verificar Tipos TypeScript
```bash
npm run type-check
```
Verifica se há erros de tipagem sem gerar build

### Lint (Verificar Código)
```bash
npm run lint
```
Verifica padrões de código e possíveis problemas

### Lint + Fix Automático
```bash
npm run lint -- --fix
```
Corrige automaticamente problemas simples

---

## 📦 Gerenciamento de Dependências

### Instalar Dependências
```bash
npm install
```

### Adicionar Nova Dependência
```bash
npm install nome-do-pacote
```

### Adicionar Dependência de Desenvolvimento
```bash
npm install -D nome-do-pacote
```

### Atualizar Dependências
```bash
npm update
```

### Remover Dependência
```bash
npm uninstall nome-do-pacote
```

### Verificar Vulnerabilidades
```bash
npm audit
```

### Corrigir Vulnerabilidades
```bash
npm audit fix
```

---

## 🗄️ Supabase (SQL)

### Criar Tabela
```sql
-- Executar no SQL Editor do Supabase
-- Arquivo: supabase/schema.sql
```

### Inserir Produto
```sql
INSERT INTO produtos (
    categoria, nome, slug, descricao_curta,
    aplicacao, descricao_tecnica, caracteristicas_beneficios,
    codigo_produto, imagem_url
) VALUES (
    'Equipamentos Médicos',
    'Nome do Produto',
    'nome-do-produto',
    'Descrição curta',
    'Aplicação do produto',
    'Especificações técnicas',
    'Benefício 1\nBenefício 2\nBenefício 3',
    'PROD-001',
    'https://seu-projeto.supabase.co/storage/v1/object/public/produtos/imagem.jpg'
);
```

### Listar Produtos
```sql
SELECT * FROM produtos ORDER BY created_at DESC;
```

### Buscar por Categoria
```sql
SELECT * FROM produtos
WHERE categoria = 'Equipamentos Médicos'
ORDER BY nome;
```

### Atualizar Produto
```sql
UPDATE produtos
SET nome = 'Novo Nome', descricao_curta = 'Nova descrição'
WHERE slug = 'slug-do-produto';
```

### Deletar Produto
```sql
DELETE FROM produtos WHERE slug = 'slug-do-produto';
```

### Contar Produtos por Categoria
```sql
SELECT categoria, COUNT(*) as total
FROM produtos
GROUP BY categoria;
```

---

## 🖼️ Storage (Supabase)

### Upload de Imagem (via Dashboard)
1. Storage → produtos
2. Upload file
3. Copiar URL pública

### URL de Imagem
Formato:
```
https://seu-projeto.supabase.co/storage/v1/object/public/produtos/nome-arquivo.jpg
```

---

## 🌐 Git

### Inicializar Repositório
```bash
git init
```

### Adicionar Arquivos
```bash
git add .
```

### Commit
```bash
git commit -m "Mensagem do commit"
```

### Conectar com Repositório Remoto
```bash
git remote add origin https://github.com/usuario/repo.git
```

### Push (Enviar para GitHub)
```bash
git push -u origin main
```

### Pull (Baixar Atualizações)
```bash
git pull origin main
```

### Ver Status
```bash
git status
```

### Ver Histórico
```bash
git log --oneline
```

### Criar Branch
```bash
git checkout -b nome-da-branch
```

---

## 🚢 Deploy

### Deploy na Vercel (CLI)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy em Produção
vercel --prod
```

### Deploy na Vercel (Dashboard)
1. Acesse vercel.com
2. New Project
3. Import Git Repository
4. Configure Environment Variables
5. Deploy

### Configurar Variáveis de Ambiente na Vercel
1. Dashboard → Projeto → Settings
2. Environment Variables
3. Adicionar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`

---

## 🧹 Limpeza e Manutenção

### Limpar Cache do Next.js
```bash
rm -rf .next
npm run build
```

### Limpar node_modules e Reinstalar
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Limpar Build de Produção
```bash
rm -rf .next
rm -rf out
```

---

## 🔍 Debug

### Ver Logs em Desenvolvimento
```bash
npm run dev
# Logs aparecem no terminal
```

### Ver Logs em Produção (Vercel)
1. Dashboard Vercel
2. Seu Projeto
3. Logs

### Abrir DevTools do Navegador
- **Chrome/Edge**: F12 ou Ctrl+Shift+I
- **Firefox**: F12 ou Ctrl+Shift+I
- **Safari**: Cmd+Option+I

### Ver Network Requests
1. F12 → Network
2. Recarregar página
3. Ver requests ao Supabase

---

## 📊 Análise

### Ver Tamanho do Build
```bash
npm run build
# Output mostra tamanho de cada página
```

### Analisar Bundle
```bash
# Instalar ferramenta
npm install -D @next/bundle-analyzer

# Adicionar ao next.config.js
# Rodar análise
ANALYZE=true npm run build
```

---

## 🛠️ Troubleshooting

### Erro: Port 3000 em Uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Ou usar porta diferente
npm run dev -- -p 3001
```

### Erro: Module Not Found
```bash
rm -rf node_modules
npm install
```

### Erro: TypeScript
```bash
npm run type-check
# Ver erros detalhados
```

### Erro: Supabase Connection
```bash
# Verificar .env.local
cat .env.local

# Testar conexão
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

---

## 📱 Testes em Dispositivos

### Testar em Dispositivo Mobile
```bash
# 1. Descobrir IP local
# Windows: ipconfig
# Mac/Linux: ifconfig

# 2. Rodar dev server
npm run dev

# 3. Acessar do celular
# http://SEU_IP:3000
```

### Testar Responsividade
1. F12 → Toggle Device Toolbar
2. Selecionar dispositivo
3. Testar interações

---

## 🎨 Customização

### Alterar Cores
Editar: `tailwind.config.js`
```js
colors: {
  medical: {
    light: '#NOVA_COR',
    DEFAULT: '#NOVA_COR',
    dark: '#NOVA_COR',
  }
}
```

### Alterar Número do WhatsApp
Editar: `.env.local`
```
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

### Adicionar Nova Categoria
Editar: `lib/types.ts`
```typescript
export const CATEGORIAS_MAP = {
  // ... categorias existentes
  'nova-categoria': {
    slug: 'nova-categoria',
    nome: 'Nova Categoria',
    descricao: 'Descrição',
    destaque: 'Destaque'
  }
}
```

---

## 📚 Documentação Relacionada

| Arquivo | Descrição |
|---------|-----------|
| `README.md` | Documentação completa |
| `INICIO-RAPIDO.md` | Setup em 10 minutos |
| `ESTRUTURA.md` | Arquitetura do projeto |
| `RESUMO-PROJETO.md` | Visão geral |
| `COMANDOS.md` | Este arquivo |

---

## ⌨️ Atalhos do VS Code

| Atalho | Ação |
|--------|------|
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+P` | Buscar arquivo |
| `Ctrl+Shift+F` | Buscar em todos arquivos |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+\`` | Abrir terminal |
| `Ctrl+Shift+\`` | Novo terminal |
| `Ctrl+/` | Comentar linha |
| `Alt+Shift+F` | Formatar documento |
| `F2` | Renomear símbolo |
| `Ctrl+D` | Selecionar próxima ocorrência |

---

## 🎯 Comandos Mais Usados

```bash
# Dia a dia
npm run dev                    # Rodar desenvolvimento
npm run build                  # Build de produção
git add . && git commit -m ""  # Commit rápido
git push                       # Enviar para GitHub

# Verificações
npm run type-check             # Verificar tipos
npm run lint                   # Verificar código

# Manutenção
npm install                    # Instalar dependências
npm update                     # Atualizar pacotes
```

---

**PenseMed** - Comandos e Referências Rápidas 🚀
