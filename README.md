# Fintrack

Personal financial tracker built with Next.js 14+ (App Router), Supabase, and TanStack Query.

## Features

- **Auth** — Email/password and magic link via Supabase Auth
- **Accounts** — Checking, savings, credit card, cash with balances (create, edit, delete)
- **Transactions** — Manual entry/edit, categories (including delete), monthly filters
- **Debit orders** — Recurring payments with create/edit/delete, pause/resume, upcoming widgets; auto-processed via Edge Function cron
- **Savings goals** — Progress tracking, contributions, projected completion, delete
- **Date night goals** — Themed savings + monthly budget + idea planner (including delete ideas)
- **Dashboard** — Net worth, spending charts, upcoming debits, goals overview
- **MCP server** — AI-queryable tools for transactions, goals, debit orders
- **`/api/insights`** — Placeholder for future AI-generated insights

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Copy env file**
   ```bash
   cp .env.local.example .env.local
   ```
   Add your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and optionally `SUPABASE_SERVICE_ROLE_KEY`.

3. **Run migrations** (Supabase CLI)
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```
   Or paste `supabase/migrations/20260320120000_initial_schema.sql` into the Supabase SQL editor.

4. **Enable auth providers** in Supabase Dashboard → Authentication → Providers (Email enabled by default).

5. **Start the app**
   ```bash
   npm install
   npm run dev
   ```

6. **Deploy Edge Function** (optional, for auto debit processing)
   ```bash
   npx supabase functions deploy process-debit-orders
   ```
   Set `CRON_SECRET` and schedule via Supabase Dashboard or `cron.toml`.

## MCP Server

Expose financial data to AI assistants:

```bash
MCP_USER_ID=your-supabase-user-uuid npm run mcp
```

Tools: `get_transactions`, `get_goal_progress`, `get_upcoming_debit_orders`, `get_account_summary`

Add to Cursor MCP config (stdio):
```json
{
  "mcpServers": {
    "fintrack": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/path/to/Fintrack",
      "env": {
        "MCP_USER_ID": "your-user-uuid",
        "NEXT_PUBLIC_SUPABASE_URL": "...",
        "SUPABASE_SERVICE_ROLE_KEY": "..."
      }
    }
  }
}
```

## Project structure

```
app/                  # Routes (dashboard, accounts, transactions, …)
components/           # UI and feature components
lib/supabase/         # Browser + server Supabase clients
lib/mcp/              # MCP server + query tools
supabase/migrations/  # Postgres schema + RLS
supabase/functions/   # process-debit-orders cron
```

## Generate TypeScript types

After schema changes:
```bash
npm run types:gen
```
