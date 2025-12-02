import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { trpc } from "./trpc-client";
import { ToolDefinition } from "../server/tools/builder";

// Helper to preserve type safety when registering tools
async function registerTool<T extends z.ZodType>(
  server: McpServer,
  tool: ToolDefinition<T>
) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.schema,
    },
    // The SDK's ToolCallback type is complex and conditional.
    // We define our handler with strict internal types (args is z.infer<T>).
    // We then cast this specific function to 'any' to pass it to registerTool.
    // This is safer than using 'any' in the function signature itself because
    // we maintain strict checking within our handler body.
    (async (args: z.infer<T>, _extra: unknown) => {
      const result = await tool.handler(args, { trpc });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }) as any
  );
}

export async function registerTools(
  server: McpServer,
  tools: ToolDefinition<any>[]
) {
  for (const tool of tools) {
    // Ensure the tool satisfies the constraint for registerTool
    await registerTool(server, tool as ToolDefinition<z.ZodType>);
  }
}
