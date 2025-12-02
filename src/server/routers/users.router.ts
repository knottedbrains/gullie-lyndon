import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const usersRouter = createTRPCRouter({
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    // Return user from context (set by getCurrentUser in TRPC context)
    return ctx.user;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    }),

  updateProfile: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Get user from session/auth
      // For now, this is a placeholder
      throw new Error("Not implemented - requires authentication");
    }),
});

