import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { employees } from "../db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

export const employeesRouter = createTRPCRouter({
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
            ilike(employees.fullName, `%${input.search}%`),
            ilike(employees.email, `%${input.search}%`)
          )
        );
      }

      const result = await ctx.db
        .select()
        .from(employees)
        .where(conditions.length > 0 ? or(...conditions) : undefined)
        .orderBy(desc(employees.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return result;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [employee] = await ctx.db
        .select()
        .from(employees)
        .where(eq(employees.id, input.id))
        .limit(1);
      if (!employee) {
        throw new Error("Employee not found");
      }
      return employee;
    }),

  create: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        officeLocation: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newEmployee] = await ctx.db
        .insert(employees)
        .values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          officeLocation: input.officeLocation,
        })
        .returning();
      return newEmployee;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        fullName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().min(1).optional(),
        officeLocation: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [updated] = await ctx.db
        .update(employees)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, id))
        .returning();
      if (!updated) {
        throw new Error("Employee not found");
      }
      return updated;
    }),
});

