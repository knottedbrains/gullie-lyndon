import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { EventEmitter } from "events";
import { getAIResponse, AIConfig } from "../services/openai-service";
import { emailService } from "../services/email-service";
import { movesTools } from "../tools/moves";
import { housingTools } from "../tools/housing";
import { servicesTools } from "../tools/services";
import { financialTools } from "../tools/financial";
import { operationsTools } from "../tools/operations";
import { chatSessions, chatMessages, moves } from "../db/schema";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { appRouter } from "./_app";

// Event emitter for chat messages (still useful for real-time, though we poll DB now)
const chatEmitter = new EventEmitter();

type ToolCallArguments = Record<string, string | number | boolean | null | undefined>;

export const chatRouter = createTRPCRouter({
  // Create a new chat session
  create: publicProcedure
    .input(z.object({
      moveId: z.string().uuid().optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      // Create AgentMail inbox only if we can successfully create the session
      let agentMailInboxId, agentMailEmailAddress;
      
      try {
        // First, try to create the database session to ensure the table exists
        // We'll create the inbox after confirming DB is ready
        const [session] = await ctx.db
          .insert(chatSessions)
          .values({
            title: "New Conversation",
            agentMailInboxId: null,
            agentMailEmailAddress: null,
            moveId: input?.moveId,
          })
          .returning();

        // Only create inbox if DB insert succeeded
        try {
          const inbox = await emailService.createInbox(`Chat ${new Date().toISOString()}`);
          agentMailInboxId = inbox.inboxId;
          // Use inboxId as email address (AgentMail format: inboxId@agentmail.to)
          agentMailEmailAddress = inbox.inboxId;
          
          // Update session with inbox info
          await ctx.db
            .update(chatSessions)
            .set({
              agentMailInboxId,
              agentMailEmailAddress,
            })
            .where(eq(chatSessions.id, session.id));
          
          return {
            ...session,
            agentMailInboxId,
            agentMailEmailAddress,
          };
        } catch (e: any) {
          // Check if it's a limit exceeded error - don't spam logs
          if (e.statusCode === 403 && e.body?.name === "LimitExceededError") {
            console.warn("AgentMail inbox limit exceeded - session created without inbox");
          } else {
            console.error("Failed to create AgentMail inbox:", e);
          }
          // Return session without inbox - it can be created later if needed
          return session;
        }
      } catch (dbError: any) {
        // Database error - don't create inbox if DB fails
        console.error("❌ tRPC failed on chat.create:", dbError.message);
        throw new Error(`Failed to create chat session: ${dbError.message}`);
      }
    }),

  // List all chat sessions
  list: publicProcedure
    .query(async ({ ctx }) => {
      const sessions = await ctx.db
        .select()
        .from(chatSessions)
        .orderBy(desc(chatSessions.updatedAt));
      
      // For admin view, enrich with user and company info via move
      if (ctx.user?.role === "admin") {
        const sessionsWithDetails = await Promise.all(
          sessions.map(async (session) => {
            if (session.moveId) {
              const move = await ctx.db.query.moves.findFirst({
                where: eq(moves.id, session.moveId),
                with: {
                  employee: true,
                  employer: true,
                },
              });
              return {
                ...session,
                employee: move?.employee,
                employer: move?.employer,
              };
            }
            return session;
          })
        );
        return sessionsWithDetails;
      }
      
      return sessions;
    }),

  // Get chat history
  getHistory: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      const messages = await ctx.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.sessionId))
        .orderBy(chatMessages.createdAt);

      // Map to the expected format for the frontend
      return messages.map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        timestamp: msg.createdAt,
        toolCalls: msg.toolCalls,
        metadata: msg.metadata,
        reasoning: msg.reasoning,
        model: msg.model,
      }));
    }),

  // Get session details
  getSession: publicProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const session = await ctx.db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, input.sessionId),
      });
      return session;
    }),

  // Send email
  sendEmail: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        to: z.array(z.string()),
        subject: z.string(),
        body: z.string(),
        cc: z.array(z.string()).optional(),
        bcc: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log(`[sendEmail] Starting email send for session ${input.sessionId}`);
      const session = await ctx.db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, input.sessionId),
      });
      if (!session?.agentMailInboxId) {
        console.error(`[sendEmail] No inbox found for session ${input.sessionId}`);
        throw new Error("No email inbox associated with this session");
      }

      console.log(`[sendEmail] Session found with inbox ${session.agentMailInboxId}`);
      let result;
      try {
        result = await emailService.sendEmail({
          inboxId: session.agentMailInboxId,
          to: input.to,
          subject: input.subject,
          body: input.body,
          cc: input.cc,
          bcc: input.bcc,
        });
        console.log(`[sendEmail] Email service returned:`, result);
      } catch (error) {
        console.error(`[sendEmail] Email service error:`, error);
        throw error;
      }

      // Save email ID if available from result
      const emailId = result?.messageId;
      
      // Save as assistant message
      await ctx.db.insert(chatMessages).values({
        sessionId: input.sessionId,
        role: "assistant",
        content: `Sent email to ${input.to.join(", ")}\nSubject: ${input.subject}\n\n${input.body}`,
        metadata: {
          isEmail: true,
          emailTo: input.to,
          emailSubject: input.subject,
          emailCc: input.cc,
          emailBcc: input.bcc,
          emailId: emailId,
        },
      });

      console.log(`[sendEmail] Email message saved to chat, returning result`);
      return result;
    }),

  // Sync emails
  syncEmails: publicProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const session = await ctx.db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, input.sessionId),
      });
      if (!session?.agentMailInboxId) {
        console.log(`[syncEmails] No inbox found for session ${input.sessionId}`);
        return { count: 0 };
      }

      console.log(`[syncEmails] Syncing emails for inbox ${session.agentMailInboxId}`);
      const response = await emailService.listMessages(session.agentMailInboxId);
      let count = 0;

      // The response has a 'messages' property which is the array
      const msgList = response.messages || [];
      console.log(`[syncEmails] Found ${msgList.length} messages in inbox`);

      for (const msgItem of msgList) {
        // Check if already exists by emailId in metadata
        // Using jsonb check for exact match on emailId
        const existing = await ctx.db
          .select()
          .from(chatMessages)
          .where(
             sql`${chatMessages.sessionId} = ${input.sessionId} AND ${chatMessages.metadata}->>'emailId' = ${msgItem.messageId}`
          )
          .limit(1);

        if (existing.length === 0) {
           // Fetch full message to get body
           let fullMsg;
           try {
             fullMsg = await emailService.getMessage(session.agentMailInboxId, msgItem.messageId);
           } catch (e) {
             console.error(`[syncEmails] Failed to fetch full message ${msgItem.messageId}:`, e);
             continue;
           }

           // Add a check for existing AGAIN to avoid race condition in polling
           const doubleCheck = await ctx.db
            .select()
            .from(chatMessages)
            .where(
               sql`${chatMessages.sessionId} = ${input.sessionId} AND ${chatMessages.metadata}->>'emailId' = ${msgItem.messageId}`
            )
            .limit(1);
            
           if (doubleCheck.length > 0) continue;

           // Determine if this is a sent or received email by comparing from address with inbox email
           const isSent = session.agentMailEmailAddress && 
                          fullMsg.from?.toLowerCase() === session.agentMailEmailAddress.toLowerCase();
           const role = isSent ? "assistant" : "user";
           
           const content = isSent
             ? `Sent email to ${Array.isArray(fullMsg.to) ? fullMsg.to.join(", ") : fullMsg.to}\nSubject: ${fullMsg.subject}\n\n${fullMsg.text || fullMsg.html || "(No content)"}`
             : `Email from ${fullMsg.from}\nSubject: ${fullMsg.subject}\n\n${fullMsg.text || fullMsg.html || fullMsg.preview || "(No content)"}`;
           
           await ctx.db.insert(chatMessages).values({
             sessionId: input.sessionId,
             role: role,
             content: content,
             createdAt: fullMsg.createdAt ? new Date(fullMsg.createdAt) : new Date(),
             metadata: {
               isEmail: true,
               emailId: fullMsg.messageId,
               emailFrom: fullMsg.from,
               emailSubject: fullMsg.subject,
               emailTo: Array.isArray(fullMsg.to) ? fullMsg.to : [fullMsg.to],
               emailBody: fullMsg.text || fullMsg.html || fullMsg.preview || "(No content)",
               emailHtml: fullMsg.html,
             }
           });
           console.log(`[syncEmails] Synced ${isSent ? "sent" : "received"} email ${fullMsg.messageId}`);
           count++;
        }
      }
      
      if (count > 0) {
          await ctx.db
            .update(chatSessions)
            .set({ updatedAt: new Date() })
            .where(eq(chatSessions.id, input.sessionId));
      }

      return { count };
    }),

  // Send a message and get AI response
  sendMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        message: z.string().min(1),
        config: z.object({
          model: z.enum([
            // GPT-5.1 (Latest)
            "gpt-5.1",
            "gpt-5.1-2025-11-13",
            "gpt-5.1-chat-latest",
            // GPT-5
            "gpt-5",
            "gpt-5-2025-08-07",
            "gpt-5-chat-latest",
            "gpt-5-mini",
            "gpt-5-mini-2025-08-07",
            "gpt-5-pro",
            "gpt-5-pro-2025-10-06",
            // GPT-4.1
            "gpt-4.1",
            "gpt-4.1-2025-04-14",
            "gpt-4.1-mini",
            "gpt-4.1-mini-2025-04-14",
            // GPT-4o
            "gpt-4o",
            "gpt-4o-2024-11-20",
            "gpt-4o-mini",
            "chatgpt-4o-latest",
            // o1 (Reasoning)
            "o1",
            "o1-2024-12-17",
            "o1-pro",
            "o1-pro-2025-03-19",
            // o3 (Latest Reasoning)
            "o3",
            "o3-2025-04-16",
            "o3-mini",
            "o3-mini-2025-01-31"
          ]).optional(),
          enableParallelExecution: z.boolean().optional(),
          enableExtendedThinking: z.boolean().optional(),
          maxReasoningTokens: z.number().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Save user message
      await ctx.db.insert(chatMessages).values({
        sessionId: input.sessionId,
        role: "user",
        content: input.message,
      });

      // Update session timestamp
      await ctx.db
        .update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessions.id, input.sessionId));

      // 2. Fetch conversation history for context
      const history = await ctx.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.sessionId))
        .orderBy(chatMessages.createdAt);

      const conversationHistory = history.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));

      // 3. Get AI response with server-side tRPC caller and config
      const serverCaller = appRouter.createCaller(ctx);
      const aiResponse = await getAIResponse(
        conversationHistory,
        input.sessionId,
        serverCaller,
        input.config as Partial<AIConfig>
      );

      // Log tool calls for debugging
      if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
        aiResponse.toolCalls.forEach((call) => {
          if (call.name === "create_test_move") {
            console.log("🔧 [Chat Router] create_test_move tool call detected:", {
              name: call.name,
              arguments: call.arguments,
              result: call.result ? JSON.parse(call.result) : null,
            });
          }
        });
      }

      // 4. Save assistant message with reasoning and model
      await ctx.db.insert(chatMessages).values({
        sessionId: input.sessionId,
        role: "assistant",
        content: aiResponse.content,
        toolCalls: aiResponse.toolCalls,
        reasoning: aiResponse.reasoning,
        model: aiResponse.model,
      });

      // Update session title if it's the first few messages and title is default
      if (history.length <= 2) {
        // Simple heuristic: use the user's first message or generate one (simplified here)
        const firstUserMsg = history.find(m => m.role === "user");
        if (firstUserMsg) {
          const title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
          await ctx.db
            .update(chatSessions)
            .set({ title })
            .where(eq(chatSessions.id, input.sessionId));
        }
      }

      return { success: true };
    }),

  // Delete a chat session
  delete: publicProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(chatSessions)
        .where(eq(chatSessions.id, input.sessionId));
      return { success: true };
    }),

  // Bulk delete chat sessions
  bulkDelete: publicProcedure
    .input(z.object({ sessionIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      if (input.sessionIds.length > 0) {
        await ctx.db
          .delete(chatSessions)
          .where(inArray(chatSessions.id, input.sessionIds));
      }
      return { success: true };
    }),

  // List available MCP tools for a workflow
  listTools: publicProcedure.query(() => {
    const allTools: Array<{ name: string; description: string; workflow: string }> = [];

    const addTools = (workflow: string, tools: Array<{ name: string; description: string }>) => {
      tools.forEach((tool) => {
        allTools.push({
          name: tool.name,
          description: tool.description,
          workflow,
        });
      });
    };

    addTools("moves", movesTools);
    addTools("housing", housingTools);
    addTools("services", servicesTools);
    addTools("financial", financialTools);
    addTools("operations", operationsTools);

    return allTools;
  }),
});
