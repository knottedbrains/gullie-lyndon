import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { housingOptions } from "../db/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import {
  createHousingOptionSchema,
  listHousingSchema,
  searchHousingSchema,
  selectHousingSchema,
} from "../schemas/housing";

export const housingRouter = createTRPCRouter({
  list: publicProcedure
    .input(listHousingSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.moveId) {
        conditions.push(eq(housingOptions.moveId, input.moveId));
      }
      if (input.type) {
        conditions.push(eq(housingOptions.type, input.type));
      }
      if (input.isTemporary !== undefined) {
        conditions.push(eq(housingOptions.isTemporary, input.isTemporary));
      }
      if (input.matchCategory) {
        conditions.push(eq(housingOptions.matchCategory, input.matchCategory));
      }

      const result = await ctx.db
        .select()
        .from(housingOptions)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(housingOptions.createdAt));
      return result;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [option] = await ctx.db
        .select()
        .from(housingOptions)
        .where(eq(housingOptions.id, input.id))
        .limit(1);
      if (!option) {
        throw new Error("Housing option not found");
      }
      return option;
    }),

  create: publicProcedure
    .input(createHousingOptionSchema)
    .mutation(async ({ ctx, input }) => {
      const [newOption] = await ctx.db
        .insert(housingOptions)
        .values({
          moveId: input.moveId,
          type: input.type,
          isTemporary: input.isTemporary,
          address: input.address,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          price: input.price,
          pricePerMonth: input.pricePerMonth,
          pricePerNight: input.pricePerNight,
          commuteToOffice: input.commuteToOffice,
          commuteMode: input.commuteMode,
          parkingAvailable: input.parkingAvailable,
          leaseTerms: input.leaseTerms,
          minStay: input.minStay,
          availabilityStartDate: input.availabilityStartDate,
          availabilityEndDate: input.availabilityEndDate,
          neighborhoodRating: input.neighborhoodRating,
          matchCategory: input.matchCategory,
        })
        .returning();
      return newOption;
    }),

  select: publicProcedure
    .input(selectHousingSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(housingOptions)
        .set({
          selected: true,
          updatedAt: new Date(),
        })
        .where(eq(housingOptions.id, input.id))
        .returning();
      if (!updated) {
        throw new Error("Housing option not found");
      }
      return updated;
    }),

  search: publicProcedure
    .input(searchHousingSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [eq(housingOptions.moveId, input.moveId)];
      if (input.city) {
        conditions.push(eq(housingOptions.city, input.city));
      }
      if (input.maxCommute) {
        conditions.push(
          lte(housingOptions.commuteToOffice, input.maxCommute)
        );
      }

      const result = await ctx.db
        .select()
        .from(housingOptions)
        .where(and(...conditions))
        .orderBy(desc(housingOptions.matchCategory));
      return result;
    }),
});
