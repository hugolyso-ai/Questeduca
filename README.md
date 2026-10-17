# QUESTEDUCA

Jogo educativo português para alunos do 1.º ao 9.º ano — aprender jogando.

## Stack

- **Frontend**: React 18 + Vite (diretório `src/`)
- **Base de dados / autenticação / armazenamento**: Supabase (sem backend próprio)

## Desenvolvimento

```bash
npm install
npm run dev
```

## Publicação (Vercel)

A publicação usa o `vercel.json` na raiz, com um único serviço Vite público.

Variáveis de ambiente obrigatórias no projeto Vercel:

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |

## Autenticação Google

Configurar no Google Cloud Console (credenciais OAuth):

- **Authorized JavaScript origins**: `https://questeduca.pt`, `https://www.questeduca.pt`
- **Authorized redirect URI**: `https://<PROJETO>.supabase.co/auth/v1/callback`

## Base de dados

Migrações em `supabase/migrations/`, aplicadas via ferramenta Supabase (não por CLI).
