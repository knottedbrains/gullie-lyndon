import OpenAI from "openai";
import { executeToolCall } from "./openai-service";
import type { AIConfig } from "./openai-service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type StreamEvent =
  | { type: "text_delta"; content: string }
  | { type: "tool_call_start"; toolName: string; callId: string }
  | { type: "tool_call_args"; callId: string; args: string }
  | { type: "tool_call_complete"; callId: string; toolName: string; result: string }
  | { type: "reasoning"; content: string }
  | { type: "complete"; fullContent: string; toolCalls: any[] }
  | { type: "error"; error: string };

export async function* streamAIResponse(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  sessionId?: string,
  trpcCaller?: any,
  config: Partial<AIConfig> = {}
): AsyncGenerator<StreamEvent> {
  try {
    const stream = await openai.chat.completions.create({
      model: config.model || "gpt-4o-mini",
      messages,
      stream: true,
      tools: config.model?.startsWith("o") ? undefined : (await getOpenAITools()), // Reasoning models don't support tools
    });

    let fullContent = "";
    const toolCalls = new Map<string, { name: string; arguments: string }>();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Handle text content
      if (delta?.content) {
        fullContent += delta.content;
        yield { type: "text_delta", content: delta.content };
      }

      // Handle reasoning (for o1/o3 models)
      if ((delta as any)?.reasoning_content) {
        yield { type: "reasoning", content: (delta as any).reasoning_content };
      }

      // Handle tool calls
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          const callId = toolCall.id || `call_${toolCall.index}`;

          if (toolCall.function?.name) {
            // Tool call started
            toolCalls.set(callId, {
              name: toolCall.function.name,
              arguments: toolCall.function.arguments || "",
            });
            yield {
              type: "tool_call_start",
              toolName: toolCall.function.name,
              callId,
            };
          } else if (toolCall.function?.arguments) {
            // Accumulate arguments
            const existing = toolCalls.get(callId);
            if (existing) {
              existing.arguments += toolCall.function.arguments;
              yield {
                type: "tool_call_args",
                callId,
                args: toolCall.function.arguments,
              };
            }
          }
        }
      }

      // Check if tool call is complete (finish_reason = tool_calls)
      if (chunk.choices[0]?.finish_reason === "tool_calls") {
        // Execute all tool calls
        for (const [callId, toolCall] of toolCalls.entries()) {
          try {
            const args = JSON.parse(toolCall.arguments);
            const result = await executeToolCall(
              toolCall.name,
              args,
              sessionId,
              trpcCaller
            );

            yield {
              type: "tool_call_complete",
              callId,
              toolName: toolCall.name,
              result,
            };
          } catch (error) {
            yield {
              type: "error",
              error: `Failed to execute tool ${toolCall.name}: ${error}`,
            };
          }
        }

        // Clear tool calls after execution
        toolCalls.clear();
      }
    }

    // Stream complete
    yield {
      type: "complete",
      fullContent,
      toolCalls: Array.from(toolCalls.values()),
    };
  } catch (error) {
    yield {
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get tools in OpenAI format (reuse from openai-service)
async function getOpenAITools() {
  const { movesTools } = await import("../tools/moves");
  const { housingTools } = await import("../tools/housing");
  const { servicesTools } = await import("../tools/services");
  const { financialTools } = await import("../tools/financial");
  const { operationsTools } = await import("../tools/operations");
  const { emailTools } = await import("../tools/email");
  const { zodToJsonSchema } = await import("zod-to-json-schema");

  const registry = [
    ...movesTools,
    ...housingTools,
    ...servicesTools,
    ...financialTools,
    ...operationsTools,
    ...emailTools,
  ];

  return registry.map((tool) => {
    const jsonSchema = zodToJsonSchema(tool.schema);
    return {
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: jsonSchema as any,
      },
    };
  });
}
