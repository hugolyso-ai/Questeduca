# QUESTEDUCA - Deploy no Railway

## 🚀 Railway - Deploy Completo (Frontend + Backend)

O Railway é a melhor opção para aplicações full-stack como o QUESTEDUCA.

---

## Passo 1: Criar Conta Railway

1. Aceder a **https://railway.app**
2. Clicar "Login" → "Login with GitHub"
3. Autorizar acesso ao GitHub

---

## Passo 2: Criar MongoDB Atlas (Base de Dados)

1. Aceder a **https://cloud.mongodb.com**
2. Criar conta gratuita
3. "Build a Database" → **M0 FREE** → Create
4. **Database Access** → Add Database User:
   - Username: `questeduca`
   - Password: (gerar e **GUARDAR!**)
5. **Network Access** → Add IP Address → **Allow Access from Anywhere** (0.0.0.0/0)
6. **Database** → Connect → "Connect your application"
7. Copiar a connection string:
   ```
   mongodb+srv://questeduca:SUA_PASSWORD@cluster0.xxxxx.mongodb.net/questeduca?retryWrites=true&w=majority
   ```

---

## Passo 3: Deploy Backend no Railway

1. No Railway Dashboard, clicar **"New Project"**
2. Selecionar **"Deploy from GitHub repo"**
3. Escolher o repositório do QUESTEDUCA
4. Clicar **"Add variables"** e adicionar:

| Variable | Value |
|----------|-------|
| `MONGO_URL` | `mongodb+srv://questeduca:PASSWORD@cluster0.xxx.mongodb.net/questeduca?retryWrites=true&w=majority` |
| `DB_NAME` | `questeduca` |
| `EMERGENT_LLM_KEY` | `sk-emergent-45eB911119215D050F` |
| `STRIPE_SECRET_KEY` | `sk_test_xxx` (sua chave Stripe) |
| `CORS_ORIGINS` | `*` |
| `PORT` | `8001` |

5. Clicar **"Deploy"**
6. Aguardar o deploy (2-3 minutos)
7. Clicar em **"Settings"** → **"Networking"** → **"Generate Domain"**
8. Copiar o URL gerado (ex: `https://questeduca-production.up.railway.app`)

---

## Passo 4: Deploy Frontend no Railway

1. No mesmo projeto, clicar **"+ New"** → **"GitHub Repo"**
2. Selecionar o mesmo repositório
3. Nas configurações do serviço:
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn install && yarn build`
   - **Start Command**: `npx serve -s build -l 3000`
4. Adicionar variável:

| Variable | Value |
|----------|-------|
| `REACT_APP_BACKEND_URL` | URL do backend (passo anterior) |

5. **"Settings"** → **"Networking"** → **"Generate Domain"**
6. Este será o URL final da aplicação!

---

## Alternativa: Deploy com Um Clique (Monorepo)

Se o repositório tiver o ficheiro `railway.json` na raiz:

1. **"New Project"** → **"Deploy from GitHub"**
2. Railway detecta automaticamente os serviços
3. Adicionar variáveis de ambiente
4. Deploy automático

---

## Variáveis de Ambiente - Copiar/Colar

### Backend:
```
MONGO_URL=mongodb+srv://questeduca:SUA_PASSWORD@cluster0.xxx.mongodb.net/questeduca?retryWrites=true&w=majority
DB_NAME=questeduca
EMERGENT_LLM_KEY=sk-emergent-45eB911119215D050F
STRIPE_SECRET_KEY=sk_test_xxx
CORS_ORIGINS=*
PORT=8001
```

### Frontend:
```
REACT_APP_BACKEND_URL=https://seu-backend.up.railway.app
```

---

## Verificar Deploy

### Backend:
```bash
curl https://seu-backend.up.railway.app/api/health
# Deve retornar: {"status": "healthy"}

curl https://seu-backend.up.railway.app/api/subscriptions/prices
# Deve retornar preços
```

### Frontend:
Aceder ao URL do frontend no browser - deve mostrar a landing page.

---

## Custos Railway

- **Plano Gratuito**: $5/mês de créditos (suficiente para testes)
- **Hobby Plan**: $5/mês (500 horas de execução)
- **Pro Plan**: $20/mês (uso ilimitado)

O plano gratuito é suficiente para desenvolvimento e testes!

---

## Problemas Comuns

### "Build failed"
- Verificar se `requirements.txt` existe em `/backend`
- Verificar se `package.json` existe em `/frontend`

### "MongoDB connection error"
- Verificar IP whitelist no MongoDB Atlas (0.0.0.0/0)
- Verificar se a password não tem caracteres especiais

### "CORS error"
- Adicionar URL do frontend em `CORS_ORIGINS`
- Ou usar `CORS_ORIGINS=*` para permitir todos

### "Port already in use"
- Definir `PORT=8001` nas variáveis

---

## Suporte

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
