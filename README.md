<div align="center">

# InfraFlow AI

*Gestão de TI com alma — chamados, equipamentos e tarefas, com um toque de inteligência artificial.*

✦ ✦ ✦

**Danielle Rocha**

[GitHub](https://github.com/Daniirocha) · repositório do projeto: [InfraFlow-AI](https://github.com/Daniirocha/InfraFlow-AI)

</div>

---

## Sobre este projeto

Este repositório faz parte do **meu portfólio** como desenvolvedora: é um espaço vivo, onde **pretendo continuar trabalhando** — refatorando, acrescentando funcionalidades, melhorando UX e aprendendo em público. Não é um “checklist fechado”; é um **laboratório honesto** de produto e de código, com ar profissional e curadoria pessoal.

> *Infraestrutura e suporte não precisam ser cinza. Podem ser claros, organizados e um pouco mais humanos.*

O **InfraFlow AI** é uma plataforma **full-stack** para **chamados**, **equipamentos** e **tarefas** de TI, com **priorização assistida** (Google **Gemini** quando há chave configurada; caso contrário, heurística local). Pense nela como uma base sólida para evoluir rumo a dashboards mais ricos, automações e integrações.

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Recharts, Framer Motion |
| **Backend** | NestJS 11, Prisma, PostgreSQL, JWT + refresh tokens, Swagger em `/docs` |
| **IA** | Gemini (opcional) · fallback inteligente sem API key |
| **Filas** | Redis + BullMQ (opcional · `REDIS_ENABLED=true`) |

---

## Status & ambiente local

A aplicação em si está **funcional** (API + Prisma + Next.js). O que às vezes atrapalha no dia a dia é só o **setup da máquina**: dependências, Docker e permissões. No **Windows**, antivírus ou o editor podem travar pastas (`EBUSY` / `EPERM` em `node_modules`). Se isso acontecer: feche o que estiver usando a pasta, remova `api/node_modules` e `web/node_modules` e rode `npm install` de novo.

---

## Pré-requisitos

- **Node.js** 20+
- **Docker** (Postgres e Redis locais)

---

## Banco e Redis

```bash
docker compose up -d
```

Copie `api/.env.example` para `api/.env` e ajuste segredos (JWT, banco, etc.).

---

## Backend (API)

```bash
cd api
npm install
npx prisma generate
npx prisma migrate dev --name init
# Alternativa rápida sem migration versionada: npx prisma db push
npm run prisma:seed
npm run start:dev
```

- **API:** `http://localhost:4000/api`
- **Swagger:** `http://localhost:4000/docs`

### Filas (opcional)

Com Redis no ar, no `.env`:

```env
REDIS_ENABLED=true
```

### Contas demo (seed)

| E-mail | Senha | Papel |
|--------|-------|-------|
| admin@infraflow.local | Admin@123 | ADMIN |
| tecnico@infraflow.local | Tecnico@123 | TECHNICIAN |
| visualizador@infraflow.local | Viewer@123 | VIEWER |

---

## Frontend

```bash
cd web
npm install
cp .env.local.example .env.local
npm run dev
```

Abra **`http://localhost:3000`**.

---

## Problemas no Windows (`EBUSY` / `EPERM` / `node_modules`)

1. Feche Cursor/VS Code na pasta do projeto, encerre processos `node` e, se possível, pause o antivírus nessa pasta.
2. Apague `api/node_modules`, `web/node_modules` e os `package-lock.json` correspondentes, se necessário.
3. Rode `npm install` de novo em `api` e depois em `web` (ou `npx rimraf node_modules` antes).
4. Se `next` ou `nest` não forem reconhecidos, use `npx next build` e `npx nest build` dentro de cada pasta.

---

## Deploy (referência)

- **Frontend:** Vercel — `NEXT_PUBLIC_API_URL` apontando para a URL pública da API (incluindo `/api` se for o caso).
- **Backend:** Railway / Render — `DATABASE_URL` do provedor; rode `npx prisma migrate deploy` no deploy.
- **Banco:** Supabase / Railway Postgres / Neon, etc.

---

## Licença

Projeto de **portfólio** — uso educacional. Feedbacks e sugestões são bem-vindos.

---

<div align="center">

*Feito com cuidado por Danielle Rocha · em construção contínua*

</div>
