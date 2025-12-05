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
import { executeFlow, FlowDefinition } from "./flow-orchestrator";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Model Configuration
export type AIModel =
  // GPT-5.1 (Latest)
  | "gpt-5.1"
  | "gpt-5.1-2025-11-13"
  | "gpt-5.1-chat-latest"
  // GPT-5
  | "gpt-5"
  | "gpt-5-2025-08-07"
  | "gpt-5-chat-latest"
  | "gpt-5-mini"
  | "gpt-5-mini-2025-08-07"
  | "gpt-5-pro"
  | "gpt-5-pro-2025-10-06"
  // GPT-4.1
  | "gpt-4.1"
  | "gpt-4.1-2025-04-14"
  | "gpt-4.1-mini"
  | "gpt-4.1-mini-2025-04-14"
  // GPT-4o
  | "gpt-4o"
  | "gpt-4o-2024-11-20"
  | "gpt-4o-mini"
  | "chatgpt-4o-latest"
  // o1 (Reasoning)
  | "o1"
  | "o1-2024-12-17"
  | "o1-pro"
  | "o1-pro-2025-03-19"
  // o3 (Latest Reasoning)
  | "o3"
  | "o3-2025-04-16"
  | "o3-mini"
  | "o3-mini-2025-01-31";

export type AIConfig = {
  model: AIModel;
  enableParallelExecution?: boolean;
  enableExtendedThinking?: boolean;
  maxReasoningTokens?: number; // For o1/o3 models
};

// Default configuration
const DEFAULT_CONFIG: AIConfig = {
  model: "gpt-4o-mini",
  enableParallelExecution: true,
  enableExtendedThinking: false,
};

// Models that support extended thinking/reasoning
const REASONING_MODELS: AIModel[] = [
  "o1",
  "o1-2024-12-17",
  "o1-pro",
  "o1-pro-2025-03-19",
  "o3",
  "o3-2025-04-16",
  "o3-mini",
  "o3-mini-2025-01-31"
];

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
export async function executeToolCall(
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

// Detect if a tool call is a flow definition
function isFlowCall(toolName: string): boolean {
  return toolName.startsWith("flow_");
}

// Analyze tool dependencies for parallel execution
function analyzeDependencies(
  toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>
): Array<Array<number>> {
  // Simple heuristic: tools that read vs write
  // In future, this could be more sophisticated
  const batches: Array<Array<number>> = [];
  const independentBatch: number[] = [];
  const dependentIndices: number[] = [];

  // Group tools by read/write operations
  const readOnlyTools = ["list_moves", "get_move", "list_housing_options", "list_services", "list_invoices"];

  toolCalls.forEach((call, index) => {
    if (readOnlyTools.includes(call.name)) {
      independentBatch.push(index);
    } else {
      dependentIndices.push(index);
    }
  });

  // First batch: all independent read operations
  if (independentBatch.length > 0) {
    batches.push(independentBatch);
  }

  // Subsequent batches: one tool at a time for writes
  dependentIndices.forEach((index) => {
    batches.push([index]);
  });

  // If no batches, just execute all sequentially
  if (batches.length === 0) {
    batches.push(toolCalls.map((_, i) => i));
  }

  return batches;
}

export async function getAIResponse(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  sessionId?: string,
  trpcCaller?: any,
  config: Partial<AIConfig> = {}
): Promise<{
  content: string;
  toolCalls?: ToolCall[];
  reasoning?: string;
  model?: AIModel;
}> {
  const aiConfig = { ...DEFAULT_CONFIG, ...config };
  const isReasoningModel = REASONING_MODELS.includes(aiConfig.model);

  const systemMessage = {
    role: "system" as const,
    content: `You are an intelligent relocation assistant for Gullie. You help manage moves, housing, services, financial tasks, and operations.

    You have a dedicated email inbox for this conversation. You can send emails to external parties (landlords, movers, etc.) and receive their replies.
    When a user asks you to email someone, use the send_email tool.
    If you are expecting an email, you can use the sync_emails tool to check for new messages.

    IMPORTANT: When you call a tool that returns data (like get_move, create_move, list_housing, etc.), the user interface will automatically render a visual widget with all the details.
    DO NOT repeat the details returned by the tool in your text response. Instead, provide a very brief confirmation or summary (e.g., "Here is the move you requested:" or "I've created the move successfully.").
    Only mention details if you need to point out something specific or ask a follow-up question.

    FLOWS: You can create multi-step workflows by calling tools with a "flow_" prefix. Available flows:
    - flow_complete_relocation: Complete end-to-end relocation (create move, search housing, request services)
    - flow_housing_search: Search and select housing based on preferences
    - flow_invoice_and_pay: Create invoice, calculate tax grossup, and send payment request
    - flow_move_housing_chain: Demo flow that chains 3 tools (create move → search housing → request service)

    Be concise, professional, and helpful.${isReasoningModel ? "\n\nYou are using an extended thinking model. Take your time to reason through complex requests before responding." : ""}`,
  };

  // Prepare API call options
  const apiOptions: any = {
    model: aiConfig.model,
    messages: isReasoningModel
      ? messages.map((msg) => ({ role: msg.role, content: msg.content })) // Reasoning models don't support system messages in some versions
      : [systemMessage, ...messages.map((msg) => ({ role: msg.role, content: msg.content }))],
  };

  // Add tools for non-reasoning models or reasoning models that support them
  if (!isReasoningModel || aiConfig.model === "o3-mini") {
    apiOptions.tools = openAITools.length > 0 ? openAITools : undefined;
    apiOptions.tool_choice = openAITools.length > 0 ? "auto" : undefined;
  }

  // Add reasoning parameters for o1/o3 models
  if (isReasoningModel && aiConfig.maxReasoningTokens) {
    apiOptions.max_completion_tokens = aiConfig.maxReasoningTokens;
  }

  console.log(`🤖 [AI] Calling model: ${aiConfig.model}`, {
    parallel: aiConfig.enableParallelExecution,
    reasoning: isReasoningModel,
  });

  const response = await openai.chat.completions.create(apiOptions);

  const message = response.choices[0]?.message;
  if (!message) {
    return { content: "No response from AI", model: aiConfig.model };
  }

  // Extract reasoning/thinking if available (o1/o3 models)
  let reasoning: string | undefined;
  if (isReasoningModel && (response as any).choices[0]?.message?.reasoning) {
    reasoning = (response as any).choices[0].message.reasoning;
    if (reasoning) {
      console.log(`🧠 [Reasoning] Model reasoning captured (${reasoning.length} chars)`);
    }
  }

  // Handle tool calls
  if (message.tool_calls && message.tool_calls.length > 0) {
    console.log(`🔧 [Tools] Detected ${message.tool_calls.length} tool calls`);

    const toolCalls: ToolCall[] = [];
    const toolResults: Array<{
      role: "tool";
      content: string;
      tool_call_id: string;
    }> = [];

    // Check if this is a flow call
    const flowCall = message.tool_calls.find((tc) =>
      tc.type === "function" && isFlowCall(tc.function.name)
    );

    if (flowCall && flowCall.type === "function") {
      // Execute flow
      console.log(`🌊 [Flow] Executing flow: ${flowCall.function.name}`);
      const flowName = flowCall.function.name.replace("flow_", "");
      const flowArgs = JSON.parse(flowCall.function.arguments || "{}");

      const flowResult = await executeFlow(flowName, flowArgs, sessionId, trpcCaller);

      toolCalls.push({
        name: flowCall.function.name,
        arguments: flowArgs,
        result: JSON.stringify(flowResult, null, 2),
      });

      return {
        content: `Flow "${flowName}" completed successfully with ${flowResult.steps.length} steps.`,
        toolCalls,
        reasoning,
        model: aiConfig.model,
      };
    }

    // Parallel or sequential execution based on config
    if (aiConfig.enableParallelExecution) {
      console.log(`⚡ [Parallel] Analyzing dependencies for parallel execution`);
      const batches = analyzeDependencies(
        message.tool_calls
          .filter((tc) => tc.type === "function")
          .map((tc) => ({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments || "{}"),
          }))
      );

      console.log(`⚡ [Parallel] Executing ${batches.length} batches`);

      for (const batch of batches) {
        const batchPromises = batch.map(async (index) => {
          const toolCall = message.tool_calls![index];
          if (toolCall.type === "function") {
            const args = JSON.parse(toolCall.function.arguments || "{}") as Record<
              string,
              unknown
            >;
            const result = await executeToolCall(
              toolCall.function.name,
              args,
              sessionId,
              trpcCaller
            );

            return {
              toolCall: {
                name: toolCall.function.name,
                arguments: args,
                result,
              },
              toolResult: {
                role: "tool" as const,
                content: result,
                tool_call_id: toolCall.id,
              },
            };
          }
          return null;
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((result) => {
          if (result) {
            toolCalls.push(result.toolCall);
            toolResults.push(result.toolResult);
          }
        });
      }
    } else {
      // Sequential execution (original behavior)
      console.log(`🔄 [Sequential] Executing tools sequentially`);
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === "function") {
          const args = JSON.parse(toolCall.function.arguments || "{}") as Record<
            string,
            unknown
          >;
          const result = await executeToolCall(
            toolCall.function.name,
            args,
            sessionId,
            trpcCaller
          );

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
    }

    // Get final response after tool calls
    const finalApiOptions: any = {
      model: aiConfig.model,
      messages: [
        ...messages,
        {
          role: "assistant",
          content: message.content || "",
          tool_calls: message.tool_calls,
        },
        ...toolResults,
      ],
    };

    if (!isReasoningModel || aiConfig.model === "o3-mini") {
      finalApiOptions.tools = openAITools.length > 0 ? openAITools : undefined;
    }

    const finalResponse = await openai.chat.completions.create(finalApiOptions);

    return {
      content:
        finalResponse.choices[0]?.message?.content ||
        "Tool calls executed successfully",
      toolCalls,
      reasoning,
      model: aiConfig.model,
    };
  }

  return {
    content: message.content || "No response",
    reasoning,
    model: aiConfig.model,
  };
}
