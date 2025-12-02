## gullie-lyndon

AI-powered relocation operations and communication dashboard built with **Next.js 16 (LTS)**, **tRPC**, **Drizzle ORM (Postgres)**, and **AgentMail** + **MCP** tools.

The app provides:
- **Role-based dashboards** for employees, companies, vendors, and admins
- A unified **chat interface** backed by OpenAI + domain tools (moves, housing, services, financial, operations)
- Integrated **email inboxes** per chat session via AgentMail
- A typed **Postgres schema** using Drizzle, exposed through tRPC routers (`moves`, `housing`, `services`, `financial`, `operations`, etc.)

---

## Tech Stack

- **Framework**: Next.js 16 LTS (App Router, React 18)
- **API / RPC**: tRPC with React Query
- **DB / ORM**: Drizzle ORM + Postgres
- **AI**: OpenAI (chat + tools)
- **Email**: AgentMail inbox + send APIs
- **Styling / UI**: TailwindCSS, Radix UI primitives, shadcn-style components
- **MCP**: `xmcp` + custom MCP servers and tools in `src/mcp`

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example env file and fill in the required values:

```bash
cp .env.example .env
```

At minimum you will need values for:

- **Database**: Postgres connection string used by Drizzle
- **OpenAI**: API key for the AI assistant
- **AgentMail**: API key / credentials for inbox + email sending

Check `.env.example` and any references in `src/server` / `src/mcp` for the full list.

### 3. Database setup (Drizzle + Postgres)

Make sure your Postgres instance is running and the connection string in `.env` is correct, then:

```bash
# Generate migrations from schema
npm run db:generate

# Run migrations
npm run db:migrate

# (optional) Open Drizzle Studio
npm run db:studio
```

The main schema lives under:
- `src/server/db/schema.ts`
- `src/server/db/tables/*`

---

## Running the app

### Development

This project runs **xmcp** (for MCP tooling) and **Next.js dev** together:

```bash
npm run dev
```

This will:
- start `xmcp dev`
- start `next dev --experimental-https`

> **Note**: Follow your existing workflow for how you prefer to access the dev server (port, HTTPS certs, etc.).

### Production build

```bash
# Build MCP + Next
npm run build

# Start production server
npm start
```

---

## Key Features / Modules

- **Dashboards**: `src/app/(dashboard)/**`
  - `page.tsx` uses `trpc.users.getCurrentUser` and renders `EmployeeDashboard`, `CompanyDashboard`, `VendorDashboard`, or `AdminDashboard`.
- **Chat & Email**:
  - tRPC router: `src/server/routers/chat.router.ts`
  - Integrates OpenAI, AgentMail, and domain tools to orchestrate multi-step workflows.
- **Domain routers**:
  - `src/server/routers/moves.router.ts`
  - `src/server/routers/housing.router.ts`
  - `src/server/routers/services.router.ts`
  - `src/server/routers/financial.router.ts`
  - `src/server/routers/operations.router.ts`
- **MCP / Tools**:
  - MCP servers and tools: `src/mcp/**`
  - Tool handlers and workflows: `src/mcp/tool-handler.ts`, `src/mcp/workflows/**`

---

## Development Notes

- **Types first**: Keep shared types in `src/types` and reuse them across routers, components, and tools.
- **DB changes**: Update Drizzle schema, regenerate migrations, then migrate.
- **Tools**: New domain logic should usually be exposed both as:
  - a **tRPC router** under `src/server/routers`
  - and/or an **MCP tool** under `src/mcp/tools`

---

## Scripts Reference

For quick reference:

```bash
# Dev server (xmcp + Next)
npm run dev

# Build & start
npm run build
npm start

# Lint
npm run lint

# Drizzle / DB
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:push

# MCP entrypoints
npm run mcp:moves
npm run mcp:housing
npm run mcp:services
npm run mcp:financial
npm run mcp:operations
```

Adjust and extend this README as the product direction for Gullie / Lyndon evolves.
