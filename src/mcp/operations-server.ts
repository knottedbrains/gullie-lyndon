import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpOperationsTools } from "./tools/operations";
import { registerTools } from "./tool-handler";
import { OPERATIONS_WORKFLOW } from "./workflows";

export async function createOperationsServer() {
  const server = new McpServer(
    {
      name: "gullie-operations-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    }
  );

  server.prompt("operations-workflow", "Get the Operations workflow SOP", () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: OPERATIONS_WORKFLOW,
        },
      },
    ],
  }));

  await registerTools(server, mcpOperationsTools);

  return server;
}
