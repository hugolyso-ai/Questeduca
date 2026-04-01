# QUESTEDUCA - Deploy Guide

## ⚠️ IMPORTANTE

O QUESTEDUCA é uma aplicação **full-stack** (React + FastAPI + MongoDB).

**O Vercel NÃO suporta bem backends Python complexos.** 

Recomendamos:
- **Frontend**: Vercel
- **Backend**: Railway ou Render (gratuito)

---

## OPÇÃO 1: Apenas Frontend no Vercel (Mais Fácil)

### Passo 1: Configurar Backend no Railway (GRATUITO)

1. Aceder a **https://railway.app**
2. "New Project" → "Deploy from GitHub"
3. Selecionar o repositório
4. **Root Directory**: `backend`
5. Adicionar variáveis:
   - `MONGO_URL` = sua connection string MongoDB Atlas
   - `DB_NAME` = questeduca
   - `EMERGENT_LLM_KEY` = sk-emergent-45eB911119215D050F
   - `STRIPE_SECRET_KEY` = sk_test_xxx
   - `CORS_ORIGINS` = *
6. Deploy automático - copiar URL (ex: `https://questeduca-backend.up.railway.app`)

### Passo 2: Frontend no Vercel

1. Aceder a **https://vercel.com**
2. "Add New" → "Project" → Importar GitHub
3. **Root Directory**: `frontend`
4. **Framework Preset**: Create React App
5. Adicionar variável:
   - `REACT_APP_BACKEND_URL` = URL do Railway (passo anterior)
6. Deploy

---

## OPÇÃO 2: Tudo no Railway

1. **https://railway.app** → New Project
2. Deploy from GitHub
3. **Root Directory**: deixar vazio (raiz)
4. Adicionar variáveis de ambiente
5. Railway detecta automaticamente o monorepo

---

## Variáveis de Ambiente Necessárias

### Backend (Railway/Render):
```
MONGO_URL=mongodb+srv://USER:PASS@cluster.mongodb.net/questeduca
DB_NAME=questeduca
EMERGENT_LLM_KEY=sk-emergent-45eB911119215D050F
STRIPE_SECRET_KEY=sk_test_xxx
CORS_ORIGINS=*
```

### Frontend (Vercel):
```
REACT_APP_BACKEND_URL=https://seu-backend.up.railway.app
```

---

## MongoDB Atlas Setup

1. https://cloud.mongodb.com → Sign up
2. Create Cluster → M0 Free
3. Database Access → Add user
4. Network Access → Allow from anywhere (0.0.0.0/0)
5. Connect → Get connection string

---

## Se Insistir no Vercel para Tudo

O Vercel tem limitações sérias para Python:
- Timeout de 10 segundos
- Não suporta WebSockets
- Dificuldade com async MongoDB

Se quiser tentar, use a branch `vercel-serverless` (se existir) ou contacte suporte.
