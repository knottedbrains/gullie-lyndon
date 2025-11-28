import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { policyExceptions, checkIns, services } from "../db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

const exceptionStatusSchema = z.enum(["pending", "approved", "denied"]);
const checkInTypeSchema = z.enum(["t_minus_48", "day_of", "t_plus_48"]);

export const operationsRouter = createTRPCRouter({
  policyExceptions: createTRPCRouter({
    list: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid().optional(),
          status: exceptionStatusSchema.optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input.moveId) {
          conditions.push(eq(policyExceptions.moveId, input.moveId));
        }
        if (input.status) {
          conditions.push(eq(policyExceptions.status, input.status));
        }

        const result = await ctx.db
          .select()
          .from(policyExceptions)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(policyExceptions.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid(),
          serviceId: z.string().uuid().optional(),
          serviceType: z.string().min(1),
          requestedService: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [newException] = await ctx.db
          .insert(policyExceptions)
          .values({
            moveId: input.moveId,
            serviceId: input.serviceId,
            serviceType: input.serviceType,
            requestedService: input.requestedService,
            status: "pending",
          })
          .returning();
        return newException;
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          status: exceptionStatusSchema,
          employerDecision: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(policyExceptions)
          .set({
            status: input.status,
            employerDecision: input.employerDecision,
            employerDecisionAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(policyExceptions.id, input.id))
          .returning();
        if (!updated) {
          throw new Error("Policy exception not found");
        }
        return updated;
      }),
  }),

  checkIns: createTRPCRouter({
    list: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid().optional(),
          serviceId: z.string().uuid().optional(),
          checkInType: checkInTypeSchema.optional(),
          upcoming: z.boolean().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input.moveId) {
          conditions.push(eq(checkIns.moveId, input.moveId));
        }
        if (input.serviceId) {
          conditions.push(eq(checkIns.serviceId, input.serviceId));
        }
        if (input.checkInType) {
          conditions.push(eq(checkIns.checkInType, input.checkInType));
        }
        if (input.upcoming) {
          conditions.push(gte(checkIns.scheduledAt, new Date()));
        }

        const result = await ctx.db
          .select()
          .from(checkIns)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(checkIns.scheduledAt));
        return result;
      }),

    create: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid(),
          serviceId: z.string().uuid().optional(),
          checkInType: checkInTypeSchema,
          scheduledAt: z.date(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [newCheckIn] = await ctx.db
          .insert(checkIns)
          .values({
            moveId: input.moveId,
            serviceId: input.serviceId,
            checkInType: input.checkInType,
            scheduledAt: input.scheduledAt,
          })
          .returning();
        return newCheckIn;
      }),

    complete: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(checkIns)
          .set({
            completedAt: new Date(),
            notes: input.notes,
            updatedAt: new Date(),
          })
          .where(eq(checkIns.id, input.id))
          .returning();
        if (!updated) {
          throw new Error("Check-in not found");
        }
        return updated;
      }),
  }),

  serviceBreaks: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid().optional() }))
      .query(async ({ ctx, input }) => {
        const conditions = [eq(services.serviceBreak, true)];
        if (input.moveId) {
          conditions.push(eq(services.moveId, input.moveId));
        }

        const result = await ctx.db
          .select()
          .from(services)
          .where(and(...conditions))
          .orderBy(desc(services.createdAt));
        return result;
      }),

    report: publicProcedure
      .input(
        z.object({
          serviceId: z.string().uuid(),
          description: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(services)
          .set({
            serviceBreak: true,
            serviceBreakDescription: input.description,
            updatedAt: new Date(),
          })
          .where(eq(services.id, input.serviceId))
          .returning();
        if (!updated) {
          throw new Error("Service not found");
        }
        return updated;
      }),

    addRemediation: publicProcedure
      .input(
        z.object({
          serviceId: z.string().uuid(),
          remediationPlan: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(services)
          .set({
            remediationPlan: input.remediationPlan,
            updatedAt: new Date(),
          })
          .where(eq(services.id, input.serviceId))
          .returning();
        if (!updated) {
          throw new Error("Service not found");
        }
        return updated;
      }),
  }),
});

