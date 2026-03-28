# QUESTEDUCA - Guia de Deploy no Vercel

## 🔧 Configuração Rápida

### 1. MongoDB Atlas (OBRIGATÓRIO)

Aceda a **https://cloud.mongodb.com** e siga:

1. **Criar conta** → Sign up gratuito
2. **Criar cluster** → "Build a Database" → M0 FREE → Create
3. **Criar utilizador**:
   - Security → Database Access → Add New Database User
   - Username: `questeduca`
   - Password: (gerar e **GUARDAR!**)
   - Role: "Read and write to any database"
4. **Permitir acesso**:
   - Security → Network Access → Add IP Address
   - Clicar "Allow Access from Anywhere" (0.0.0.0/0)
5. **Obter connection string**:
   - Deployment → Database → Connect → "Connect your application"
   - Copiar string e substituir `<password>` pela password real

**Exemplo de string:**
```
mongodb+srv://questeduca:MinhaPassword123@cluster0.abc123.mongodb.net/questeduca?retryWrites=true&w=majority
```

---

### 2. Configurar Vercel

1. Aceder a **https://vercel.com**
2. Importar repositório do GitHub
3. **Settings** (não mudar nada no build por agora)
4. **Environment Variables** - Adicionar:

| Key | Value |
|-----|-------|
| `MONGO_URL` | `mongodb+srv://questeduca:SUA_PASSWORD@cluster0.xxx.mongodb.net/questeduca?retryWrites=true&w=majority` |
| `DB_NAME` | `questeduca` |
| `EMERGENT_LLM_KEY` | `sk-emergent-45eB911119215D050F` |
| `STRIPE_SECRET_KEY` | `sk_test_xxxxx` (sua chave Stripe) |
| `CORS_ORIGINS` | `*` |
| `REACT_APP_BACKEND_URL` | _(deixar vazio ou URL final)_ |

5. **Deploy**

---

### 3. Build Settings (se necessário)

Se o build falhar, configurar manualmente:

- **Framework Preset**: Other
- **Build Command**: `cd frontend && yarn install && yarn build`
- **Output Directory**: `frontend/build`
- **Install Command**: `yarn install`

---

## ⚠️ Notas Importantes

### MongoDB Connection String
- Não incluir espaços
- A password não pode ter caracteres especiais como `@` ou `/`
- Formato: `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/questeduca`

### Vercel Limits
- Serverless functions têm limite de 10s
- Para funcionalidades pesadas, considere Railway/Render

### Se continuar com 404:
1. Verifique se todas as variáveis estão definidas
2. Verifique se MongoDB Atlas tem IP whitelist correto
3. Faça re-deploy após adicionar variáveis

---

## Variáveis para Copiar/Colar

```
MONGO_URL=mongodb+srv://questeduca:SUA_PASSWORD@cluster0.xxx.mongodb.net/questeduca?retryWrites=true&w=majority
DB_NAME=questeduca
EMERGENT_LLM_KEY=sk-emergent-45eB911119215D050F
STRIPE_SECRET_KEY=sk_test_xxx
CORS_ORIGINS=*
```

