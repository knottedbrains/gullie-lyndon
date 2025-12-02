import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { moves, employees, employers, policies } from "../db/schema";
import { eq, desc, ilike, and } from "drizzle-orm";
import {
  createMoveSchema,
  createTestMoveSchema,
  listMovesSchema,
  moveStatusSchema,
  updateMoveSchema,
} from "../schemas/moves";

export const movesRouter = createTRPCRouter({
  list: publicProcedure
    .input(listMovesSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.status) {
        conditions.push(eq(moves.status, input.status));
      }
      if (input.employerId) {
        conditions.push(eq(moves.employerId, input.employerId));
      }

      // Role-based filtering
      if (ctx.user) {
        if (ctx.user.role === "company" && ctx.user.employerId) {
          // Validate UUID format before using in query
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(ctx.user.employerId)) {
            conditions.push(eq(moves.employerId, ctx.user.employerId));
          }
        } else if (ctx.user.role === "employee") {
          // For employees, we need to find their employee record first
          // This would require a join or separate query - for now, we'll filter client-side
          // In a real implementation, you'd want to add userId to employees table
        }
      }

      // For admin users, include employer information
      if (ctx.user?.role === "admin") {
        const result = await ctx.db.query.moves.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          orderBy: desc(moves.createdAt),
          limit: input.limit,
          offset: input.offset,
          with: {
            employer: true,
          },
        });
        return result;
      }

      // For non-admin users, return basic move data
      const result = await ctx.db
        .select()
        .from(moves)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(moves.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return result;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const move = await ctx.db.query.moves.findFirst({
        where: eq(moves.id, input.id),
        with: {
          employee: true,
          employer: true,
        }
      });

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

  updateEmployer: publicProcedure
    .input(
      z.object({
        moveId: z.string().uuid(),
        employerName: z.string().min(1),
        employerEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Find or create employer
      let employerId: string;
      
      // Try to find by name (exact match case insensitive)
      const existingByName = await ctx.db
        .select()
        .from(employers)
        .where(ilike(employers.name, input.employerName))
        .limit(1);
        
      if (existingByName.length > 0) {
        employerId = existingByName[0].id;
      } else {
        // Create new employer
        const [newEmployer] = await ctx.db
          .insert(employers)
          .values({
            name: input.employerName,
            email: input.employerEmail || `hr@${input.employerName.toLowerCase().replace(/\s+/g, "")}.com`, // Placeholder email if not provided
          })
          .returning();
        employerId = newEmployer.id;
      }

      // 2. Update move
      const [updatedMove] = await ctx.db
        .update(moves)
        .set({
          employerId: employerId,
          updatedAt: new Date(),
        })
        .where(eq(moves.id, input.moveId))
        .returning();

      if (!updatedMove) {
        throw new Error("Move not found");
      }
      
      // Fetch full move details to return
      const fullMove = await ctx.db.query.moves.findFirst({
        where: eq(moves.id, input.moveId),
        with: {
          employer: true,
          employee: true,
        }
      });

      return fullMove;
    }),

  // Create a test move with auto-generated employee and employer
  createTestMove: publicProcedure
    .input(createTestMoveSchema)
    .mutation(async ({ ctx, input }) => {
      // Create or get test employer
      const existingEmployer = await ctx.db
        .select()
        .from(employers)
        .where(eq(employers.email, input.employerEmail ?? "hr@testcompany.com"))
        .limit(1);

      let employer = existingEmployer[0];

      if (!employer) {
        const [newEmployer] = await ctx.db
          .insert(employers)
          .values({
            name: input.employerName ?? "Test Company",
            email: input.employerEmail ?? "hr@testcompany.com",
          })
          .returning();
        employer = newEmployer;
      }

      // Create or get test employee
      const existingEmployee = await ctx.db
        .select()
        .from(employees)
        .where(eq(employees.email, input.employeeEmail ?? "test.employee@example.com"))
        .limit(1);

      let employee = existingEmployee[0];

      if (!employee) {
        const [newEmployee] = await ctx.db
          .insert(employees)
          .values({
            fullName: input.employeeName ?? "Test Employee",
            email: input.employeeEmail ?? "test.employee@example.com",
            phone: input.employeePhone ?? "+1-555-0100",
            officeLocation: input.officeLocation ?? "New York Office",
          })
          .returning();
        employee = newEmployee;
      }

      // Create the move
      const [newMove] = await ctx.db
        .insert(moves)
        .values({
          employeeId: employee.id,
          employerId: employer.id,
          originCity: input.originCity,
          destinationCity: input.destinationCity,
          officeLocation: input.officeLocation,
          programType: input.programType,
          benefitAmount: input.benefitAmount,
          moveDate: input.moveDate,
          status: "initiated",
        })
        .returning();

      return {
        move: newMove,
        employee,
        employer,
      };
    }),
});
