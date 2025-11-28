import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { moves, employees, employers, policies } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const moveStatusSchema = z.enum([
  "initiated",
  "intake_in_progress",
  "housing_search",
  "services_booked",
  "in_transit",
  "completed",
  "cancelled",
]);

const createMoveSchema = z.object({
  employeeId: z.string().uuid(),
  employerId: z.string().uuid(),
  policyId: z.string().uuid().optional(),
  originCity: z.string().min(1),
  destinationCity: z.string().min(1),
  officeLocation: z.string().min(1),
  programType: z.string().optional(),
  benefitAmount: z.string().optional(),
  moveDate: z.date().optional(),
});

const updateMoveSchema = z.object({
  id: z.string().uuid(),
  status: moveStatusSchema.optional(),
  lifestyleIntakeCompleted: z.boolean().optional(),
  householdComposition: z
    .object({
      relocatingAlone: z.boolean(),
      spousePartner: z.string().optional(),
      familyMembers: z.array(z.string()).optional(),
    })
    .optional(),
  housingPreferences: z
    .object({
      requiredCriteria: z.array(z.string()),
      niceToHaveCriteria: z.array(z.string()),
      neighborhoodPreferences: z.array(z.string()),
      hobbies: z.array(z.string()),
      walkability: z.boolean(),
      urbanRural: z.enum(["urban", "rural", "suburban"]),
      commuteDistance: z.number(),
    })
    .optional(),
  moveDate: z.date().optional(),
});

export const movesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: moveStatusSchema.optional(),
        employerId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(moves)
        .orderBy(desc(moves.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return result;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [move] = await ctx.db
        .select()
        .from(moves)
        .where(eq(moves.id, input.id))
        .limit(1);
      if (!move) {
        throw new Error("Move not found");
      }
      return move;
    }),

  create: publicProcedure
    .input(createMoveSchema)
    .mutation(async ({ ctx, input }) => {
      const [newMove] = await ctx.db
        .insert(moves)
        .values({
          employeeId: input.employeeId,
          employerId: input.employerId,
          policyId: input.policyId,
          originCity: input.originCity,
          destinationCity: input.destinationCity,
          officeLocation: input.officeLocation,
          programType: input.programType,
          benefitAmount: input.benefitAmount,
          moveDate: input.moveDate,
          status: "initiated",
        })
        .returning();
      return newMove;
    }),

  update: publicProcedure
    .input(updateMoveSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [updatedMove] = await ctx.db
        .update(moves)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(moves.id, id))
        .returning();
      if (!updatedMove) {
        throw new Error("Move not found");
      }
      return updatedMove;
    }),

  initiateMove: publicProcedure
    .input(createMoveSchema)
    .mutation(async ({ ctx, input }) => {
      const [newMove] = await ctx.db
        .insert(moves)
        .values({
          employeeId: input.employeeId,
          employerId: input.employerId,
          policyId: input.policyId,
          originCity: input.originCity,
          destinationCity: input.destinationCity,
          officeLocation: input.officeLocation,
          programType: input.programType,
          benefitAmount: input.benefitAmount,
          moveDate: input.moveDate,
          status: "initiated",
        })
        .returning();
      return newMove;
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: moveStatusSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedMove] = await ctx.db
        .update(moves)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(moves.id, input.id))
        .returning();
      if (!updatedMove) {
        throw new Error("Move not found");
      }
      return updatedMove;
    }),
});

