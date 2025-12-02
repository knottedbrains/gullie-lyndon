import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { policyExceptions, checkIns, services } from "../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import {
  addRemediationSchema,
  checkInTypeSchema,
  completeCheckInSchema,
  createCheckInSchema,
  createPolicyExceptionSchema,
  exceptionStatusSchema,
  listCheckInsSchema,
  listPolicyExceptionsSchema,
  listServiceBreaksSchema,
  reportServiceBreakSchema,
  updateExceptionStatusSchema,
} from "../schemas/operations";

export const operationsRouter = createTRPCRouter({
  policyExceptions: createTRPCRouter({
    list: publicProcedure
      .input(listPolicyExceptionsSchema)
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
      .input(createPolicyExceptionSchema)
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
      .input(updateExceptionStatusSchema)
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
      .input(listCheckInsSchema)
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
      .input(createCheckInSchema)
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
      .input(completeCheckInSchema)
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
      .input(listServiceBreaksSchema)
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
      .input(reportServiceBreakSchema)
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
      .input(addRemediationSchema)
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
