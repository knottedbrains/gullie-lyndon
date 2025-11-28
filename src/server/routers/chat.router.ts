import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import { getAIResponse } from "../services/openai-service";

// Event emitter for chat messages
const chatEmitter = new EventEmitter();

type ToolCallArguments = Record<string, string | number | boolean | null | undefined>;

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    name: string;
    arguments: ToolCallArguments;
    result?: string;
  }>;
}

// Store chat sessions (in production, use Redis or database)
const chatSessions = new Map<string, ChatMessage[]>();

export const chatRouter = createTRPCRouter({
  // Send a message and get AI response
  sendMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        message: z.string().min(1),
        workflow: z
          .enum(["moves", "housing", "services", "financial", "operations"])
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const sessionId = input.sessionId || `session-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: input.message,
        timestamp: new Date(),
      };

      // Get or create session
      const session = chatSessions.get(sessionId) || [];
      session.push(userMessage);
      chatSessions.set(sessionId, session);

      // Emit user message
      chatEmitter.emit("message", { sessionId, message: userMessage });

      // Get AI response with MCP tool integration
      const conversationHistory = session.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const aiResponse = await getAIResponse(conversationHistory, input.workflow);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: aiResponse.content,
        timestamp: new Date(),
        toolCalls: aiResponse.toolCalls,
      };

      session.push(assistantMessage);
      chatSessions.set(sessionId, session);

      // Emit assistant message
      chatEmitter.emit("message", { sessionId, message: assistantMessage });

      return {
        sessionId,
        message: assistantMessage,
      };
    }),

  // Subscribe to chat messages
  onMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .subscription(({ input }) => {
      return observable<ChatMessage>((emit) => {
        const handler = (data: { sessionId: string; message: ChatMessage }) => {
          if (data.sessionId === input.sessionId) {
            emit.next(data.message);
          }
        };

        chatEmitter.on("message", handler);

        // Send existing messages
        const session = chatSessions.get(input.sessionId);
        if (session) {
          session.forEach((msg) => {
            emit.next(msg);
          });
        }

        return () => {
          chatEmitter.off("message", handler);
        };
      });
    }),

  // Get chat history
  getHistory: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(({ input }) => {
      return chatSessions.get(input.sessionId) || [];
    }),

  // List available MCP tools for a workflow
  listTools: publicProcedure
    .input(
      z.object({
        workflow: z.enum(["moves", "housing", "services", "financial", "operations"]),
      })
    )
    .query(({ input }) => {
      // Return available tools for each workflow
      const tools: Record<string, Array<{ name: string; description: string }>> = {
        moves: [
          { name: "list_moves", description: "List all moves with optional filtering" },
          { name: "get_move", description: "Get details of a specific move" },
          { name: "create_move", description: "Create a new move/relocation" },
          { name: "update_move_status", description: "Update the status of a move" },
          { name: "update_lifestyle_intake", description: "Update lifestyle intake information" },
        ],
        housing: [
          { name: "search_housing", description: "Search for housing options" },
          { name: "list_housing_options", description: "List housing options with filters" },
          { name: "create_housing_option", description: "Add a new housing option" },
          { name: "select_housing", description: "Select a housing option" },
        ],
        services: [
          { name: "list_services", description: "List all services for a move" },
          { name: "create_hhg_quote", description: "Create an HHG quote" },
          { name: "create_car_shipment", description: "Create a car shipment" },
          { name: "create_flight", description: "Create a flight booking" },
          { name: "book_flight", description: "Book a flight" },
        ],
        financial: [
          { name: "list_invoices", description: "List invoices for a move" },
          { name: "create_invoice", description: "Create a new invoice" },
          { name: "calculate_tax_grossup", description: "Calculate tax and gross-up" },
        ],
        operations: [
          { name: "list_policy_exceptions", description: "List policy exceptions" },
          { name: "create_policy_exception", description: "Create a policy exception" },
          { name: "list_check_ins", description: "List check-ins for a move" },
          { name: "create_check_in", description: "Create a check-in" },
          { name: "list_service_breaks", description: "List service breaks" },
          { name: "create_service_break", description: "Create a service break" },
        ],
      };

      return tools[input.workflow] || [];
    }),
});

