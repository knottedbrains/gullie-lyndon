import { z } from "zod";
import { createTRPCRouter, publicProcedure, subscriptionProcedure } from "../trpc";
import { observable } from "@trpc/server/observable";
import {
  conversations,
  conversationParticipants,
  messages,
  moves,
  users,
} from "../db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { getAIResponse } from "../services/openai-service";
import { streamAIResponse, type StreamEvent } from "../services/openai-streaming";

export const conversationsRouter = createTRPCRouter({
  // Create a new conversation for a move
  create: publicProcedure
    .input(
      z.object({
        moveId: z.string().uuid(),
        title: z.string().optional(),
        type: z
          .enum(["housing", "moving", "services", "budget", "general", "vendor", "internal"])
          .default("general"),
        visibility: z
          .enum(["private", "internal", "shared"])
          .default("shared"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { moveId, title, type, visibility } = input;

      // Verify move exists
      const [move] = await ctx.db
        .select()
        .from(moves)
        .where(eq(moves.id, moveId))
        .limit(1);

      if (!move) {
        throw new Error("Move not found");
      }

      // Create conversation
      const [conversation] = await ctx.db
        .insert(conversations)
        .values({
          moveId,
          title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Discussion`,
          type,
          visibility,
          status: "active",
          createdBy: ctx.user?.id || null,
        })
        .returning();

      // Add AI participant
      await ctx.db.insert(conversationParticipants).values({
        conversationId: conversation.id,
        userId: null, // AI has no userId
        participantType: "ai",
        role: "participant",
      });

      // Add creating user as participant if authenticated
      if (ctx.user) {
        const participantType =
          ctx.user.role === "employee"
            ? "employee"
            : ctx.user.role === "admin"
            ? "admin"
            : ctx.user.role === "vendor"
            ? "vendor"
            : "admin";

        await ctx.db.insert(conversationParticipants).values({
          conversationId: conversation.id,
          userId: ctx.user.id,
          participantType,
          role: "owner",
        });
      }

      return conversation;
    }),

  // Get all conversations for a move
  listByMove: publicProcedure
    .input(z.object({ moveId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const convos = await ctx.db
        .select()
        .from(conversations)
        .where(eq(conversations.moveId, input.moveId))
        .orderBy(desc(conversations.updatedAt));

      // Get participant counts for each conversation
      const conversationsWithCounts = await Promise.all(
        convos.map(async (conv) => {
          const participants = await ctx.db
            .select()
            .from(conversationParticipants)
            .where(eq(conversationParticipants.conversationId, conv.id));

          const lastMessage = await ctx.db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conv.id))
            .orderBy(desc(messages.createdAt))
            .limit(1);

          return {
            ...conv,
            participantCount: participants.length,
            lastMessage: lastMessage[0] || null,
          };
        })
      );

      return conversationsWithCounts;
    }),

  // Get all conversations for multiple moves (for sidebar)
  listByMoves: publicProcedure
    .input(z.object({ moveIds: z.array(z.string().uuid()) }))
    .query(async ({ ctx, input }) => {
      if (input.moveIds.length === 0) {
        return {};
      }

      const convos = await ctx.db
        .select()
        .from(conversations)
        .where(inArray(conversations.moveId, input.moveIds))
        .orderBy(desc(conversations.updatedAt));

      // Group conversations by moveId
      const conversationsByMove: Record<string, any[]> = {};

      for (const conv of convos) {
        if (!conversationsByMove[conv.moveId]) {
          conversationsByMove[conv.moveId] = [];
        }

        const participants = await ctx.db
          .select()
          .from(conversationParticipants)
          .where(eq(conversationParticipants.conversationId, conv.id));

        const lastMessage = await ctx.db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        conversationsByMove[conv.moveId].push({
          ...conv,
          participantCount: participants.length,
          lastMessage: lastMessage[0] || null,
        });
      }

      return conversationsByMove;
    }),

  // Get a single conversation with details
  get: publicProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [conversation] = await ctx.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Get participants
      const participants = await ctx.db
        .select({
          id: conversationParticipants.id,
          participantType: conversationParticipants.participantType,
          role: conversationParticipants.role,
          joinedAt: conversationParticipants.joinedAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          },
        })
        .from(conversationParticipants)
        .leftJoin(users, eq(conversationParticipants.userId, users.id))
        .where(eq(conversationParticipants.conversationId, input.conversationId));

      return {
        ...conversation,
        participants,
      };
    }),

  // Get or create default conversation for a move
  getOrCreateDefault: publicProcedure
    .input(z.object({ moveId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Try to get existing conversation
      const [existing] = await ctx.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.moveId, input.moveId),
            eq(conversations.status, "active")
          )
        )
        .orderBy(desc(conversations.createdAt))
        .limit(1);

      if (existing) {
        return existing;
      }

      // Create new default conversation
      const [conversation] = await ctx.db
        .insert(conversations)
        .values({
          moveId: input.moveId,
          title: "General Discussion",
          type: "general",
          status: "active",
          createdBy: ctx.user?.id || null,
        })
        .returning();

      // Add AI participant
      await ctx.db.insert(conversationParticipants).values({
        conversationId: conversation.id,
        userId: null,
        participantType: "ai",
        role: "participant",
      });

      // Add current user if authenticated
      if (ctx.user) {
        const participantType =
          ctx.user.role === "employee"
            ? "employee"
            : ctx.user.role === "admin"
            ? "admin"
            : ctx.user.role === "vendor"
            ? "vendor"
            : "admin";

        await ctx.db.insert(conversationParticipants).values({
          conversationId: conversation.id,
          userId: ctx.user.id,
          participantType,
          role: "owner",
        });
      }

      return conversation;
    }),

  // Send a message in a conversation
  sendMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        message: z.string(),
        config: z
          .object({
            model: z.string().optional(),
            enableParallelExecution: z.boolean().optional(),
            enableExtendedThinking: z.boolean().optional(),
            maxReasoningTokens: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { conversationId, message, config } = input;

      // Verify conversation exists
      const [conversation] = await ctx.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Save user message
      const [userMessage] = await ctx.db
        .insert(messages)
        .values({
          conversationId,
          authorId: ctx.user?.id || null,
          authorType: "user",
          content: message,
        })
        .returning();

      // Get conversation history
      const history = await ctx.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);

      // Call AI service
      const aiResponse = await getAIResponse(
        history.map((m) => ({
          role: m.authorType === "ai" ? "assistant" : m.authorType === "system" ? "system" : "user",
          content: m.content,
        })),
        conversationId,
        ctx.db,
        config as any // Type cast - config comes from client
      );

      // Save AI response
      const [aiMessage] = await ctx.db
        .insert(messages)
        .values({
          conversationId,
          authorId: null, // AI has no authorId
          authorType: "ai",
          content: aiResponse.content,
          toolCalls: aiResponse.toolCalls as any,
          reasoning: aiResponse.reasoning,
          model: aiResponse.model,
        })
        .returning();

      // Update conversation timestamp
      await ctx.db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));

      return {
        userMessage,
        aiMessage,
      };
    }),

  // Get messages for a conversation
  getMessages: publicProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const msgs = await ctx.db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          authorType: messages.authorType,
          content: messages.content,
          toolCalls: messages.toolCalls,
          reasoning: messages.reasoning,
          model: messages.model,
          metadata: messages.metadata,
          createdAt: messages.createdAt,
          author: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(messages)
        .leftJoin(users, eq(messages.authorId, users.id))
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);

      return msgs;
    }),

  // Add a participant to a conversation
  addParticipant: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(["owner", "participant", "observer"]).default("participant"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { conversationId, email, role } = input;

      // Find user by email
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw new Error(`No user found with email: ${email}`);
      }

      // Check if already a participant
      const existing = await ctx.db
        .select()
        .from(conversationParticipants)
        .where(
          and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, user.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("User is already a participant in this conversation");
      }

      // Determine participant type based on user role
      const participantType =
        user.role === "employee"
          ? "employee"
          : user.role === "admin"
          ? "admin"
          : user.role === "vendor"
          ? "vendor"
          : "admin";

      // Add participant
      const [participant] = await ctx.db
        .insert(conversationParticipants)
        .values({
          conversationId,
          userId: user.id,
          participantType: participantType as any,
          role,
        })
        .returning();

      return {
        ...participant,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  // Remove a participant from a conversation
  removeParticipant: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        participantId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { conversationId, participantId } = input;

      // Verify participant exists
      const [participant] = await ctx.db
        .select()
        .from(conversationParticipants)
        .where(
          and(
            eq(conversationParticipants.id, participantId),
            eq(conversationParticipants.conversationId, conversationId)
          )
        )
        .limit(1);

      if (!participant) {
        throw new Error("Participant not found");
      }

      // Don't allow removing AI participant
      if (participant.participantType === "ai") {
        throw new Error("Cannot remove AI participant");
      }

      // Delete participant
      await ctx.db
        .delete(conversationParticipants)
        .where(eq(conversationParticipants.id, participantId));

      return { success: true };
    }),

  // Update conversation visibility
  updateVisibility: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        visibility: z.enum(["private", "internal", "shared"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { conversationId, visibility } = input;

      const [conversation] = await ctx.db
        .update(conversations)
        .set({ visibility })
        .where(eq(conversations.id, conversationId))
        .returning();

      return conversation;
    }),

  // Delete a conversation
  delete: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { conversationId } = input;

      // Verify conversation exists
      const [conversation] = await ctx.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Delete all messages
      await ctx.db
        .delete(messages)
        .where(eq(messages.conversationId, conversationId));

      // Delete all participants
      await ctx.db
        .delete(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversationId));

      // Delete the conversation
      await ctx.db
        .delete(conversations)
        .where(eq(conversations.id, conversationId));

      return { success: true };
    }),

  // Stream AI response (with tool calls support)
  streamMessage: subscriptionProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        message: z.string(),
        config: z
          .object({
            model: z.string().optional(),
            enableParallelExecution: z.boolean().optional(),
            enableExtendedThinking: z.boolean().optional(),
            maxReasoningTokens: z.number().optional(),
          })
          .optional(),
      })
    )
    .subscription(async ({ ctx, input }) => {
      return observable<StreamEvent>((emit) => {
        (async () => {
          try {
            const { conversationId, message, config } = input;

            // Save user message
            const [userMessage] = await ctx.db
              .insert(messages)
              .values({
                conversationId,
                authorId: ctx.user?.id || null,
                authorType: "user",
                content: message,
              })
              .returning();

            // Emit user message saved
            emit.next({ type: "user_message_saved", message: userMessage } as any);

            // Get conversation history
            const history = await ctx.db
              .select()
              .from(messages)
              .where(eq(messages.conversationId, conversationId))
              .orderBy(messages.createdAt);

            const formattedHistory = history.map((m) => ({
              role: m.authorType === "ai" ? "assistant" : m.authorType === "system" ? "system" : "user",
              content: m.content,
            })) as Array<{ role: "user" | "assistant" | "system"; content: string }>;

            // Stream AI response
            let fullContent = "";
            const toolCallResults: any[] = [];

            for await (const event of streamAIResponse(
              formattedHistory,
              conversationId,
              ctx,
              config as any
            )) {
              emit.next(event);

              if (event.type === "text_delta") {
                fullContent += event.content;
              } else if (event.type === "tool_call_complete") {
                toolCallResults.push({
                  name: event.toolName,
                  arguments: {},
                  result: event.result,
                });
              }
            }

            // Save AI message to DB
            if (fullContent || toolCallResults.length > 0) {
              await ctx.db.insert(messages).values({
                conversationId,
                authorId: null,
                authorType: "ai",
                content: fullContent || "Tool calls executed",
                toolCalls: toolCallResults.length > 0 ? toolCallResults as any : null,
              });
            }

            // Update conversation timestamp
            await ctx.db
              .update(conversations)
              .set({ updatedAt: new Date() })
              .where(eq(conversations.id, conversationId));

            emit.complete();
          } catch (error) {
            emit.error(error as Error);
          }
        })();

        return () => {
          // Cleanup if needed
        };
      });
    }),
});
