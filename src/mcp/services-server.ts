import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpServicesTools } from "./tools/services";
import { registerTools } from "./tool-handler";
import { SERVICES_WORKFLOW } from "./workflows";

export async function createServicesServer() {
  const server = new McpServer(
    {
      name: "gullie-services-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    }
  );

  server.prompt("services-workflow", "Get the Services workflow SOP", () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: SERVICES_WORKFLOW,
        },
      },
    ],
  }));

  await registerTools(server, mcpServicesTools);

  return server;
}
