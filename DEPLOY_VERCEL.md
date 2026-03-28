# QUESTEDUCA - Guia de Deploy no Vercel

## ⚠️ IMPORTANTE: Limitações do Vercel

O Vercel funciona melhor com **frontend estático** ou **serverless functions**. 
Para uma aplicação full-stack como o QUESTEDUCA, existem duas opções:

---

## Opção A: Deploy Apenas Frontend no Vercel (RECOMENDADO)

### Backend separado em Railway/Render

1. **Backend no Railway** (gratuito até 500h/mês):
   - https://railway.app
   - Ligar ao GitHub → Selecionar pasta `backend`
   - Adicionar variáveis de ambiente

2. **Frontend no Vercel**:
   - Configurar `REACT_APP_BACKEND_URL` para apontar para o Railway

---

## Opção B: Monorepo no Vercel (Experimental)

### Passo 1: Criar conta MongoDB Atlas

1. Aceder a https://cloud.mongodb.com
2. Criar cluster gratuito (M0)
3. Database Access → Criar user
4. Network Access → Allow from anywhere (0.0.0.0/0)
5. Copiar connection string

**Exemplo de connection string:**
```
mongodb+srv://questeduca:SuaPassword123@cluster0.xxxxx.mongodb.net/questeduca?retryWrites=true&w=majority
```

### Passo 2: Configurar no Vercel

1. Importar repositório do GitHub
2. **Root Directory**: `.` (deixar vazio ou `/`)
3. **Framework Preset**: `Other`

### Passo 3: Environment Variables

Adicionar no Vercel (Settings → Environment Variables):

```
MONGO_URL = mongodb+srv://USER:PASS@cluster.mongodb.net/questeduca?retryWrites=true&w=majority
DB_NAME = questeduca
EMERGENT_LLM_KEY = sk-emergent-45eB911119215D050F
STRIPE_SECRET_KEY = sk_test_YOUR_STRIPE_KEY
CORS_ORIGINS = https://seu-projeto.vercel.app
REACT_APP_BACKEND_URL = https://seu-projeto.vercel.app
```

### Passo 4: Build Settings

No Vercel Dashboard:
- **Build Command**: `cd frontend && yarn install && yarn build`
- **Output Directory**: `frontend/build`
- **Install Command**: `yarn install`

---

## Variáveis de Ambiente - COPIAR/COLAR

### Para Vercel (substituir valores):

| Key | Value |
|-----|-------|
| `MONGO_URL` | `mongodb+srv://USER:PASS@cluster.mongodb.net/questeduca` |
| `DB_NAME` | `questeduca` |
| `EMERGENT_LLM_KEY` | `sk-emergent-45eB911119215D050F` |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `CORS_ORIGINS` | `https://questeduca.vercel.app` |
| `REACT_APP_BACKEND_URL` | `https://questeduca.vercel.app` |

---

## Erros Comuns e Soluções

### Erro: "MongoDB connection failed"
- Verificar IP whitelist no MongoDB Atlas (0.0.0.0/0)
- Verificar username/password na connection string

### Erro: "Module not found"
- Verificar que `requirements.txt` está actualizado
- O Vercel precisa de todas as dependências listadas

### Erro: "Build failed"
- Verificar que `yarn.lock` está no repositório
- Remover `node_modules` do `.gitignore`

### Erro: "Function timeout"
- Vercel tem limite de 10s para funções
- Considerar usar Railway para o backend

---

## Alternativa Recomendada: Railway + Vercel

### Backend no Railway (Gratuito)
1. https://railway.app → New Project → GitHub
2. Selecionar repositório e pasta `backend`
3. Adicionar variáveis de ambiente
4. Deploy automático

### Frontend no Vercel
1. https://vercel.com → New Project → GitHub
2. Selecionar repositório e pasta `frontend`
3. Definir `REACT_APP_BACKEND_URL` = URL do Railway

Esta configuração é mais estável e evita os limites de serverless.

---

## Suporte

Se tiver problemas com o deploy, verifique:
1. MongoDB Atlas está acessível (IP whitelist)
2. Todas as variáveis de ambiente estão definidas
3. Connection string está correta (sem espaços)

