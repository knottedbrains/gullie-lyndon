import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { housingOptions, moves } from "../db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

const housingTypeSchema = z.enum([
  "hotel",
  "serviced_apartment",
  "airbnb",
  "apartment",
  "condo",
  "single_family_home",
]);

const matchCategorySchema = z.enum(["optimal", "strong", "essential"]);

const createHousingOptionSchema = z.object({
  moveId: z.string().uuid(),
  type: housingTypeSchema,
  isTemporary: z.boolean(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  price: z.string(),
  pricePerMonth: z.string().optional(),
  pricePerNight: z.string().optional(),
  commuteToOffice: z.number().optional(),
  commuteMode: z.string().optional(),
  parkingAvailable: z.boolean().default(false),
  leaseTerms: z.string().optional(),
  minStay: z.number().optional(),
  availabilityStartDate: z.date().optional(),
  availabilityEndDate: z.date().optional(),
  neighborhoodRating: z.string().optional(),
  matchCategory: matchCategorySchema.optional(),
});

export const housingRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        moveId: z.string().uuid().optional(),
        type: housingTypeSchema.optional(),
        isTemporary: z.boolean().optional(),
        matchCategory: matchCategorySchema.optional(),
        minPrice: z.string().optional(),
        maxPrice: z.string().optional(),
      })
    )
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
    .input(z.object({ id: z.string().uuid() }))
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
    .input(
      z.object({
        moveId: z.string().uuid(),
        city: z.string().optional(),
        maxCommute: z.number().optional(),
        budget: z.string().optional(),
      })
    )
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

