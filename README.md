# InfraFlow AI

Plataforma full-stack para gerenciamento de chamados, equipamentos e tarefas de TI com priorização assistida por **Google Gemini AI**.

## Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Recharts, Framer Motion
- **Backend:** NestJS 11, Prisma, PostgreSQL, JWT + refresh tokens, Swagger (`/docs`)
- **IA:** Gemini (opcional; sem chave usa heurística local)
- **Filas:** Redis + BullMQ (opcional; `REDIS_ENABLED=true`)

## Status do projeto (visão geral)

Funcionalidades principais estão implementadas (API NestJS + Prisma + frontend Next.js). O que costuma faltar na sua máquina é só **instalar dependências e subir o banco** — no Windows, antivírus ou o próprio editor podem travar pastas (`EBUSY` / `EPERM` em `node_modules`). Nesse caso: feche o terminal/IDE que estiver usando a pasta, apague `api/node_modules` e `web/node_modules`, e rode `npm install` de novo.

## Pré-requisitos

- Node.js 20+
- Docker (para Postgres e Redis locais)

## Banco e Redis

```bash
docker compose up -d
```

Copie `api/.env.example` para `api/.env` e ajuste segredos.

## Backend (API)

```bash
cd api
npm install
npx prisma generate
npx prisma migrate dev --name init
# Alternativa rápida sem arquivo de migration: npx prisma db push
npm run prisma:seed
npm run start:dev
```

- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/docs`

### Filas (opcional)

Com Redis no ar, defina no `.env`:

```env
REDIS_ENABLED=true
```

### Contas demo (seed)

| E-mail | Senha | Papel |
|--------|-------|-------|
| admin@infraflow.local | Admin@123 | ADMIN |
| tecnico@infraflow.local | Tecnico@123 | TECHNICIAN |
| visualizador@infraflow.local | Viewer@123 | VIEWER |

## Frontend

```bash
cd web
npm install
cp .env.local.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

## Problemas no Windows (EBUSY / EPERM / node_modules)

Se `npm install` falhar com pasta bloqueada ou `ENOTEMPTY`:

1. Feche o Cursor/VS Code na pasta do projeto, feche `node` em execução e pause o antivírus na pasta do repositório, se possível.
2. Apague `api/node_modules`, `web/node_modules` e os `package-lock.json` correspondentes.
3. Rode `npm install` de novo em `api` e depois em `web` (ou use `npx rimraf node_modules` antes).
4. Se `next` ou `nest` não forem reconhecidos, use `npx next build` e `npx nest build` dentro de cada pasta.

## Deploy (referência)

- Frontend: Vercel (`NEXT_PUBLIC_API_URL` apontando para a API pública).
- Backend: Railway / Render com `DATABASE_URL` do provedor.
- Banco: Supabase / Railway Postgres.

## Licença

Projeto de portfólio — uso educacional.
