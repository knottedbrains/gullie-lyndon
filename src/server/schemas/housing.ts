import { z } from "zod";

export const housingTypeSchema = z.enum([
  "hotel",
  "serviced_apartment",
  "airbnb",
  "apartment",
  "condo",
  "single_family_home",
]);

export const matchCategorySchema = z.enum(["optimal", "strong", "essential"]);

export const createHousingOptionSchema = z.object({
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
  availabilityStartDate: z.coerce.date().optional(),
  availabilityEndDate: z.coerce.date().optional(),
  neighborhoodRating: z.string().optional(),
  matchCategory: matchCategorySchema.optional(),
});

export const searchHousingSchema = z.object({
  moveId: z.string().uuid(),
  city: z.string().optional(),
  maxCommute: z.number().optional(),
  budget: z.string().optional(),
});

export const listHousingSchema = z.object({
  moveId: z.string().uuid().optional(),
  type: housingTypeSchema.optional(),
  isTemporary: z.boolean().optional(),
  matchCategory: matchCategorySchema.optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
});

export const selectHousingSchema = z.object({
  id: z.string().uuid(),
});

