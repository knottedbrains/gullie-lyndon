import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { vendors } from "../db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

export const vendorsRouter = createTRPCRouter({
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
            ilike(vendors.name, `%${input.search}%`),
            ilike(vendors.email, `%${input.search}%`)
          )
        );
      }

      const result = await ctx.db
        .select()
        .from(vendors)
        .where(conditions.length > 0 ? or(...conditions) : undefined)
        .orderBy(desc(vendors.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return result;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [vendor] = await ctx.db
        .select()
        .from(vendors)
        .where(eq(vendors.id, input.id))
        .limit(1);
      if (!vendor) {
        throw new Error("Vendor not found");
      }
      return vendor;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        serviceTypes: z.array(z.string()).optional().default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newVendor] = await ctx.db
        .insert(vendors)
        .values({
          name: input.name,
          email: input.email,
          phone: input.phone,
          website: input.website || null,
          serviceTypes: input.serviceTypes,
        })
        .returning();
      return newVendor;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        serviceTypes: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [updated] = await ctx.db
        .update(vendors)
        .set({
          ...updates,
          website: updates.website === "" ? null : updates.website,
          updatedAt: new Date(),
        })
        .where(eq(vendors.id, id))
        .returning();
      if (!updated) {
        throw new Error("Vendor not found");
      }
      return updated;
    }),
});

