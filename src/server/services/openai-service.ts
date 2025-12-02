import OpenAI from "openai";
import { trpc as httpTrpc } from "@/mcp/trpc-client";
import { OpenAIFunctionParameters } from "@/types/openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { movesTools } from "../tools/moves";
import { housingTools } from "../tools/housing";
import { servicesTools } from "../tools/services";
import { financialTools } from "../tools/financial";
import { operationsTools } from "../tools/operations";
import { emailTools } from "../tools/email";
import { ToolDefinition } from "../tools/builder";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Unified registry of all tools
const registry: ToolDefinition<any>[] = [
  ...movesTools,
  ...housingTools,
  ...servicesTools,
  ...financialTools,
  ...operationsTools,
  ...emailTools,
];

// Convert tools to OpenAI format
const openAITools = registry.map((tool) => {
  const jsonSchema = zodToJsonSchema(tool.schema);
  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: jsonSchema as unknown as OpenAIFunctionParameters,
    },
  };
});

// Execute a tool call via tRPC
async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  sessionId?: string,
  trpcCaller?: any
): Promise<string> {
  try {
    console.log(`🔧 [Tool Execution] Executing tool: ${toolName}`, { args, sessionId });
    const tool = registry.find((t) => t.name === toolName);
    if (!tool) {
      const errorObj = {
        error: true,
        message: `Tool "${toolName}" not found`,
        availableTools: registry.map((t) => t.name),
      };
      console.error(`❌ [Tool Execution] ${errorObj.message}`);
      return JSON.stringify(errorObj, null, 2);
    }

    // We parse the args using the schema to ensure runtime safety before passing to handler
    const parsed = await tool.schema.safeParseAsync(args);
    if (!parsed.success) {
      const errorObj = {
        error: true,
        message: `Error validating arguments for tool "${toolName}"`,
        details: parsed.error.message,
        errors: parsed.error.errors,
      };
      console.error(`❌ [Tool Execution] ${errorObj.message}: ${errorObj.details}`);
      return JSON.stringify(errorObj, null, 2);
    }

    // Use server-side caller if provided, otherwise fall back to HTTP client
    const trpc = trpcCaller || httpTrpc;
    
    // tool.handler expects the inferred type, which parsed.data provides.
    // We pass the trpc context.
    const result = await tool.handler(parsed.data, { trpc, sessionId });
    console.log(`✅ [Tool Execution] Tool "${toolName}" completed successfully`);
    return JSON.stringify(result, null, 2);
  } catch (error) {
    const errorObj = {
      error: true,
      message: `Error executing tool "${toolName}"`,
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    console.error(`❌ [Tool Execution] ${errorObj.message}: ${errorObj.details}`, error);
    return JSON.stringify(errorObj, null, 2);
  }
}

// Tool call type
type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
  result: string;
};

export async function getAIResponse(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  sessionId?: string,
  trpcCaller?: any
): Promise<{ content: string; toolCalls?: ToolCall[] }> {
  const systemMessage = {
    role: "system" as const,
    content: `You are an intelligent relocation assistant for Gullie. You help manage moves, housing, services, financial tasks, and operations.
    
    You have a dedicated email inbox for this conversation. You can send emails to external parties (landlords, movers, etc.) and receive their replies.
    When a user asks you to email someone, use the send_email tool.
    If you are expecting an email, you can use the sync_emails tool to check for new messages.
    
    IMPORTANT: When you call a tool that returns data (like get_move, create_move, list_housing, etc.), the user interface will automatically render a visual widget with all the details.
    DO NOT repeat the details returned by the tool in your text response. Instead, provide a very brief confirmation or summary (e.g., "Here is the move you requested:" or "I've created the move successfully.").
    Only mention details if you need to point out something specific or ask a follow-up question.
    
    Be concise, professional, and helpful.`,
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      systemMessage,
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ],
    tools: openAITools.length > 0 ? openAITools : undefined,
    tool_choice: openAITools.length > 0 ? "auto" : undefined,
  });

  const message = response.choices[0]?.message;
  if (!message) {
    return { content: "No response from AI" };
  }

  // Handle tool calls
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCalls: ToolCall[] = [];
    const toolResults: Array<{
      role: "tool";
      content: string;
      tool_call_id: string;
    }> = [];

    for (const toolCall of message.tool_calls) {
      if (toolCall.type === "function") {
        const args = JSON.parse(toolCall.function.arguments || "{}") as Record<
          string,
          unknown
        >;
        const result = await executeToolCall(toolCall.function.name, args, sessionId, trpcCaller);

        toolCalls.push({
          name: toolCall.function.name,
          arguments: args,
          result,
        });

        toolResults.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
        });
      }
    }

    // Get final response after tool calls
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...messages,
        {
          role: "assistant",
          content: message.content || "",
          tool_calls: message.tool_calls,
        },
        ...toolResults,
      ],
      tools: openAITools.length > 0 ? openAITools : undefined,
    });

    return {
      content:
        finalResponse.choices[0]?.message?.content ||
        "Tool calls executed successfully",
      toolCalls,
    };
  }

  return {
    content: message.content || "No response",
  };
}
