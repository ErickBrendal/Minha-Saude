# Minha Saúde

App de acompanhamento de saúde (glicemia, medicações, consultas, alimentação com IA e exercícios).
Next.js 14 (App Router) + Supabase + OpenAI.

## Stack
- Next.js 14.2.35 (App Router, Server Actions)
- Supabase (Auth, Postgres, Storage) com Row Level Security
- OpenAI (análise de refeição por foto e sugestão de receitas)
- TypeScript, Recharts, lucide-react

## Variáveis de ambiente (obrigatórias)

Configure na Vercel em **Settings → Environment Variables** antes do deploy:

```
NEXT_PUBLIC_SUPABASE_URL=https://toixcfjmgzfdwzuqoggv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xn4fP0V6qv6tf_0YQ5crtQ_ZNxVLASV
OPENAI_API_KEY=<sua-chave-secreta-da-openai>
```

> A `OPENAI_API_KEY` é secreta — cole apenas no painel da Vercel, nunca no código.

## Deploy (Vercel + GitHub via git push)

```bash
# na pasta do projeto
git init
git add -A
git commit -m "deploy inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/Minha-Saude.git
git push -u origin main --force
```

Depois importe o repositório em vercel.com/new, configure as 3 variáveis acima e faça o deploy.

## Pós-deploy (Supabase)

Em **Supabase → Authentication → URL Configuration**, adicione a URL da Vercel em:
- **Site URL**
- **Redirect URLs**

Opcional para testar sem confirmar e-mail: **Authentication → Providers → Email → Confirm email = OFF**.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev
```
