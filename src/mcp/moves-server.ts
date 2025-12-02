import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpMovesTools } from "./tools/moves";
import { registerTools } from "./tool-handler";
import { PRE_MOVE_WORKFLOW } from "./workflows";

export async function createMovesServer() {
  const server = new McpServer(
    {
      name: "gullie-moves-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    }
  );

  server.prompt("pre-move-workflow", "Get the Pre-Move workflow SOP", () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: PRE_MOVE_WORKFLOW,
        },
      },
    ],
  }));

  await registerTools(server, mcpMovesTools);

  return server;
}
