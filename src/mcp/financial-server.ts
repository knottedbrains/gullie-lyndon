import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpFinancialTools } from "./tools/financial";
import { registerTools } from "./tool-handler";
import { FINANCIAL_WORKFLOW } from "./workflows";

export async function createFinancialServer() {
  const server = new McpServer(
    {
      name: "gullie-financial-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    }
  );

  server.prompt("financial-workflow", "Get the Financial workflow SOP", () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: FINANCIAL_WORKFLOW,
        },
      },
    ],
  }));

  await registerTools(server, mcpFinancialTools);

  return server;
}
