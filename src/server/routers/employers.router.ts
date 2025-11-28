import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { employers, policies } from "../db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

export const employersRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.search) {
        conditions.push(
          or(
            ilike(employers.name, `%${input.search}%`),
            ilike(employers.email, `%${input.search}%`)
          )
        );
      }

      const result = await ctx.db
        .select()
        .from(employers)
        .where(conditions.length > 0 ? or(...conditions) : undefined)
        .orderBy(desc(employers.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return result;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [employer] = await ctx.db
        .select()
        .from(employers)
        .where(eq(employers.id, input.id))
        .limit(1);
      if (!employer) {
        throw new Error("Employer not found");
      }
      return employer;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newEmployer] = await ctx.db
        .insert(employers)
        .values({
          name: input.name,
          email: input.email,
        })
        .returning();
      return newEmployer;
    }),

  policies: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ employerId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(policies)
          .where(eq(policies.employerId, input.employerId))
          .orderBy(desc(policies.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(
        z.object({
          employerId: z.string().uuid(),
          hasFormalPolicy: z.boolean().default(false),
          maxTemporaryHousingBudget: z.string().optional(),
          maxHousingBudget: z.string().optional(),
          overallRelocationBudget: z.string().optional(),
          coveredServices: z.array(z.string()).optional(),
          requiresApprovalForAll: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [newPolicy] = await ctx.db
          .insert(policies)
          .values({
            employerId: input.employerId,
            hasFormalPolicy: input.hasFormalPolicy,
            maxTemporaryHousingBudget: input.maxTemporaryHousingBudget,
            maxHousingBudget: input.maxHousingBudget,
            overallRelocationBudget: input.overallRelocationBudget,
            coveredServices: input.coveredServices || [],
            requiresApprovalForAll: input.requiresApprovalForAll,
          })
          .returning();
        return newPolicy;
      }),
  }),
});

