# 🚀 Guia de Deploy - PenseMed na Vercel

## ✅ Preparação Concluída

O projeto está 100% pronto para deploy:
- ✅ Repositório Git inicializado
- ✅ Commit inicial criado
- ✅ Dependências instaladas
- ✅ Build testado e funcionando
- ✅ Código otimizado

---

## 📋 Pré-requisitos para Deploy

Antes de fazer o deploy, você precisa ter:

### 1. Projeto Supabase Configurado
- [ ] Projeto criado em [supabase.com](https://supabase.com)
- [ ] Tabela `produtos` criada (executar `supabase/schema.sql`)
- [ ] Bucket `produtos` criado e configurado como público
- [ ] Credenciais anotadas (URL e Anon Key)

### 2. Conta GitHub/GitLab/Bitbucket
- [ ] Conta criada
- [ ] Pronto para criar repositório remoto

### 3. Conta Vercel
- [ ] Conta criada em [vercel.com](https://vercel.com)
- [ ] Conta conectada com GitHub/GitLab/Bitbucket

---

## 🔗 Opção 1: Deploy via GitHub + Vercel (Recomendado)

### Passo 1: Criar Repositório no GitHub

1. Acesse [github.com](https://github.com)
2. Clique em **"New repository"**
3. Preencha:
   - **Repository name**: `pensemed-website`
   - **Visibility**: Private ou Public (sua escolha)
   - **NÃO** marque "Initialize with README" (já temos arquivos)
4. Clique em **"Create repository"**

### Passo 2: Conectar Repositório Local ao GitHub

Execute estes comandos no terminal:

```bash
# Conectar ao repositório remoto (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/pensemed-website.git

# Enviar código para GitHub
git branch -M main
git push -u origin main
```

**Importante**: Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub.

### Passo 3: Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **"Import Git Repository"**
3. Selecione o repositório **pensemed-website**
4. Configure o projeto:
   - **Project Name**: `pensemed-website` (ou outro nome)
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `.` (padrão)

5. **Configure as Variáveis de Ambiente**:
   Clique em **"Environment Variables"** e adicione:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   Valor: https://seu-projeto.supabase.co

   NEXT_PUBLIC_SUPABASE_ANON_KEY
   Valor: sua-chave-anon-aqui

   NEXT_PUBLIC_WHATSAPP_NUMBER
   Valor: 5511999999999
   ```

   **Como obter credenciais do Supabase**:
   - Dashboard Supabase → Settings → API
   - Copie **Project URL** e **anon public key**

6. Clique em **"Deploy"**

7. Aguarde 2-3 minutos... ☕

8. **Deploy Concluído!** 🎉

Sua URL será algo como:
```
https://pensemed-website.vercel.app
```

---

## 🔗 Opção 2: Deploy via Vercel CLI

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Login na Vercel

```bash
vercel login
```

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` (não será commitado):

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

### Passo 4: Deploy

```bash
# Deploy em preview
vercel

# Deploy em produção
vercel --prod
```

### Passo 5: Configurar Variáveis no Dashboard

Após o primeiro deploy:
1. Acesse o dashboard da Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as 3 variáveis de ambiente
4. Faça um novo deploy para aplicar as variáveis

---

## 🔒 Configurar Variáveis de Ambiente na Vercel

### Via Dashboard (Recomendado)

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sua-chave-anon` | Production, Preview, Development |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `5511999999999` | Production, Preview, Development |

4. Clique em **Save**
5. Faça um **Redeploy** para aplicar as variáveis

### Via Vercel CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Cole o valor quando solicitado

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Cole o valor quando solicitado

vercel env add NEXT_PUBLIC_WHATSAPP_NUMBER production
# Cole o valor quando solicitado
```

---

## 🧪 Testar o Deploy

### Checklist Pós-Deploy

Acesse seu site em `https://seu-projeto.vercel.app` e verifique:

- [ ] Página inicial carrega sem erros
- [ ] Logo e navegação aparecem
- [ ] 3 cards de categorias são clicáveis
- [ ] Páginas de categoria abrem
- [ ] Produtos aparecem (se você inseriu no Supabase)
- [ ] Página de produto abre corretamente
- [ ] Imagens carregam
- [ ] Botões do WhatsApp abrem o app/web
- [ ] Site funciona em mobile
- [ ] Não há erros no console (F12)

### Verificar Logs

Se algo não funcionar:
1. Dashboard Vercel → Seu Projeto → **Logs**
2. Verifique erros de build ou runtime
3. Confirme se as variáveis de ambiente estão configuradas

---

## 🌐 Configurar Domínio Customizado (Opcional)

### Se você tem um domínio próprio (ex: pensemed.com.br):

1. No dashboard da Vercel, vá em **Settings** → **Domains**
2. Clique em **Add**
3. Digite seu domínio: `pensemed.com.br` ou `www.pensemed.com.br`
4. Siga as instruções para configurar DNS:
   - **Tipo A Record**: apontar para o IP da Vercel
   - **Tipo CNAME**: apontar para `cname.vercel-dns.com`
5. Aguarde propagação do DNS (até 48h)

### Configurar DNS:

**Registrar.br / Registro.br:**
```
Tipo: A
Nome: @
Valor: 76.76.21.21

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
```

**Cloudflare:**
```
Tipo: A
Nome: @
Valor: 76.76.21.21
Proxy: Desativado (DNS only)

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
Proxy: Desativado (DNS only)
```

---

## 🔄 Atualizações Futuras

### Como Atualizar o Site

Sempre que você fizer alterações no código:

```bash
# 1. Adicionar alterações
git add .

# 2. Fazer commit
git commit -m "Descrição das alterações"

# 3. Enviar para GitHub
git push origin main
```

**A Vercel fará deploy automático!** 🚀

### Verificar Status do Deploy

1. Dashboard Vercel → Seu Projeto → **Deployments**
2. Veja status: Building → Ready
3. Clique para ver logs detalhados

---

## 📊 Recursos Importantes da Vercel

### Analytics (Gratuito)
- Dashboard → Analytics
- Veja pageviews, visitantes, performance

### Monitoring
- Dashboard → Monitoring
- Veja erros em tempo real

### Preview Deployments
- Cada push em branch cria um preview
- URL única para testar antes de produção

---

## ⚠️ Problemas Comuns

### "Build failed"
**Solução**:
1. Verifique logs no dashboard
2. Confirme que as variáveis de ambiente estão configuradas
3. Teste build local: `npm run build`

### "Products not loading"
**Solução**:
1. Verifique se a tabela `produtos` existe no Supabase
2. Confirme que o bucket `produtos` está público
3. Verifique as credenciais do Supabase
4. Veja logs da Vercel

### "Images not loading"
**Solução**:
1. Confirme que o bucket Supabase está público
2. Verifique se as URLs das imagens estão corretas
3. Teste URL da imagem diretamente no navegador

### "WhatsApp not opening"
**Solução**:
1. Verifique o formato do número: `5511999999999`
2. Teste o link diretamente
3. Confirme variável `NEXT_PUBLIC_WHATSAPP_NUMBER`

---

## 🎯 Próximos Passos Após Deploy

1. **Configurar Supabase**:
   - Inserir produtos reais
   - Fazer upload de imagens
   - Testar catálogo

2. **Configurar Analytics**:
   - Google Analytics
   - Vercel Analytics
   - Meta Pixel (se usar)

3. **SEO**:
   - Adicionar sitemap
   - Configurar robots.txt
   - Verificar meta tags

4. **Monitoramento**:
   - Configurar alertas na Vercel
   - Monitorar performance
   - Acompanhar logs

---

## 📞 URLs Importantes

| Recurso | URL |
|---------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Supabase Dashboard** | https://supabase.com/dashboard |
| **GitHub** | https://github.com |
| **Documentação Vercel** | https://vercel.com/docs |
| **Documentação Next.js** | https://nextjs.org/docs |

---

## 🎉 Deploy Completo!

Após seguir este guia, seu site estará:
- ✅ No ar e acessível publicamente
- ✅ Com HTTPS automático
- ✅ Com CDN global
- ✅ Com deploy automático
- ✅ Com preview para cada commit
- ✅ Com analytics integrado

**URL do seu site**: https://seu-projeto.vercel.app

---

## 📱 Compartilhar

Compartilhe seu site:
- WhatsApp
- Email
- Redes sociais
- Google Meu Negócio
- Materiais impressos

---

**Desenvolvido para PenseMed** 🏥
**Hospedado na Vercel** ▲
