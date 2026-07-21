#!/usr/bin/env node
/**
 * Fintrack MCP Server
 *
 * Exposes financial data tools for AI assistants.
 * Run: npm run mcp
 *
 * Requires MCP_USER_ID env var (Supabase auth user UUID) and SUPABASE_SERVICE_ROLE_KEY.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createMcpSupabaseClient,
  getTransactions,
  getGoalProgress,
  getUpcomingDebitOrders,
  getAccountSummary,
  getProjectedCashflow,
  getFinancialAdvice,
} from "./tools";

const userId = process.env.MCP_USER_ID;
if (!userId) {
  console.error("MCP_USER_ID environment variable is required");
  process.exit(1);
}

const { client } = createMcpSupabaseClient(userId);

const server = new McpServer({
  name: "fintrack",
  version: "1.4.0",
});

server.tool(
  "get_transactions",
  "Fetch user transactions with optional date range and limit",
  {
    limit: z.number().optional().describe("Max rows to return"),
    from: z.string().optional().describe("ISO date start"),
    to: z.string().optional().describe("ISO date end"),
  },
  async ({ limit, from, to }) => {
    const data = await getTransactions(client, userId, { limit, from, to });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "get_goal_progress",
  "Get savings goal progress including date night goals",
  {},
  async () => {
    const data = await getGoalProgress(client, userId);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "get_upcoming_debit_orders",
  "List active debit orders due within N days",
  {
    days: z.number().optional().describe("Lookahead window in days (default 30)"),
  },
  async ({ days = 30 }) => {
    const data = await getUpcomingDebitOrders(client, userId, days);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "get_account_summary",
  "Net worth and account balances",
  {},
  async () => {
    const data = await getAccountSummary(client, userId);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "get_projected_cashflow",
  "Projected leftover for the current month: income minus active debit commitments (monthly-normalized) minus discretionary expenses",
  {},
  async () => {
    const data = await getProjectedCashflow(client, userId);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "get_financial_advice",
  "Rule-based financial advisor: Survival / Breathing room / Comfort zones and how much more income is needed to reach the next zone",
  {},
  async () => {
    const data = await getFinancialAdvice(client, userId);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
