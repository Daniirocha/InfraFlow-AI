# Deploy — InfraFlow AI (fase 2)

Este guia segue uma ordem que evita erro de CORS e de “API sem banco”: **Postgres → API (Nest) → front (Next.js)**.

Sugestão de provedores (todos têm plano gratuito ou trial): **Neon** ou **Supabase** (banco), **Railway** ou **Render** (API), **Vercel** (site Next.js). Os nomes mudam um pouco entre painéis, mas as variáveis são as mesmas.

---

## 1. Banco PostgreSQL (produção)

1. Crie um projeto em [Neon](https://neon.tech) ou [Supabase](https://supabase.com) (ou Postgres no Railway).
2. Copie a **connection string** `postgresql://...` (modo **transaction** / pooling se o provedor oferecer duas URLs — para Prisma + Nest use a URL **direta** recomendada na documentação do provedor).
3. Guarde como `DATABASE_URL` — você vai colar na API no passo 2.

---

## 2. API (NestJS) — Railway (exemplo)

1. Em [Railway](https://railway.app), **New Project** → **Deploy from GitHub** → selecione o repositório `InfraFlow-AI`.
2. Adicione um serviço apontando para a pasta **`api`** (Root Directory / Working Directory = `api`).
3. **Variáveis de ambiente** (mínimo):

| Variável | Exemplo / notas |
|----------|------------------|
| `DATABASE_URL` | Cole a URL do Postgres (passo 1). |
| `JWT_ACCESS_SECRET` | String longa e aleatória (ex.: 32+ caracteres). **Não commite.** |
| `JWT_ACCESS_EXPIRES` | `15m` (opcional). |
| `PORT` | Em muitos hosts **não precisa** — o Railway injeta. Se precisar, use `4000`. |
| `CORS_ORIGIN` | URL do seu site na Vercel, **sem barra no final** — ex.: `https://infraflow.vercel.app` (depois você atualiza com o domínio real). |
| `NODE_ENV` | `production` |
| `REDIS_ENABLED` | `false` (até você ter Redis em produção). |

Opcionais: `GEMINI_API_KEY`, `GEMINI_MODEL`.

4. **Build Command** (se o painel pedir):

```bash
npm ci && npx prisma generate && npm run build
```

5. **Start Command** (aplicar migrations e subir o servidor):

```bash
npx prisma migrate deploy && npm run start:prod
```

6. Depois do primeiro deploy, anote a **URL pública** da API (ex.: `https://infraflow-api.up.railway.app`).  
   O Nest usa prefixo global `api`, então a base dos endpoints é:

`https://SUA-API.up.railway.app/api`

7. **Seed (só uma vez, opcional)**  
   No Railway: abra um **shell** no serviço da API e rode:

```bash
npm run prisma:seed
```

Ou rode localmente com `DATABASE_URL` de produção (cuidado para não sobrescrever dados que você já queira manter).

---

## 3. Frontend (Next.js) — Vercel

1. Em [Vercel](https://vercel.com) → **Add New Project** → importe o mesmo repositório GitHub.
2. Configure:
   - **Root Directory:** `web`
   - **Framework Preset:** Next.js (detectado automaticamente)
3. **Environment Variables** (Production):

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | URL **completa** da API incluindo `/api` no final. Ex.: `https://infraflow-api.up.railway.app/api` |

4. Deploy. Abra a URL que a Vercel gerar (ex.: `https://infraflow.vercel.app`).

5. **CORS:** volte na API (Railway) e ajuste `CORS_ORIGIN` para a URL **exata** do front (Vercel), inclusive `https://`. Se usar preview deployments, pode listar várias origens separadas por vírgula no código — hoje o `main.ts` usa `split(',')` em `CORS_ORIGIN`.

---

## 4. Checklist rápido

- [ ] Postgres no ar e `DATABASE_URL` na API  
- [ ] `JWT_ACCESS_SECRET` forte na API  
- [ ] `npx prisma migrate deploy` rodando antes ou no start (comando acima)  
- [ ] `CORS_ORIGIN` = URL do front (Vercel)  
- [ ] `NEXT_PUBLIC_API_URL` = `https://.../api` (base usada pelo `fetch` no browser)  
- [ ] Testar login em produção com um usuário criado (seed ou registro, se estiver habilitado)

---

## 5. Problemas comuns

| Sintoma | O que verificar |
|--------|------------------|
| Front mostra erro de rede / CORS | `CORS_ORIGIN` na API = URL exata do Vercel; sem path extra. |
| 401 em toda request | JWT / cookie / `NEXT_PUBLIC_API_URL` errada (falta `/api`, HTTPS misturado com HTTP). |
| Erro Prisma “migration” | Rodar `prisma migrate deploy` no ambiente com `DATABASE_URL` correto. |
| Build da API falha | `npm ci` na pasta `api`; Node 20+ no provedor. |

---

## 6. Domínio próprio (opcional)

- **Vercel:** Project → Domains → adicione o domínio e siga o DNS.
- **Railway:** Settings → Networking → domínio customizado para a API.
- Atualize `CORS_ORIGIN` e `NEXT_PUBLIC_API_URL` para os novos hosts.

---

*Última dica: depois do primeiro deploy bem-sucedido, gere um novo `JWT_ACCESS_SECRET` se em algum momento ele tiver vazado em log ou print.*
