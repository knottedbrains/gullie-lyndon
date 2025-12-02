import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpHousingTools } from "./tools/housing";
import { registerTools } from "./tool-handler";
import { HOUSING_WORKFLOW } from "./workflows";

export async function createHousingServer() {
  const server = new McpServer(
    {
      name: "gullie-housing-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    }
  );

  server.prompt("housing-workflow", "Get the Housing workflow SOP", () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: HOUSING_WORKFLOW,
        },
      },
    ],
  }));

  await registerTools(server, mcpHousingTools);

  return server;
}
