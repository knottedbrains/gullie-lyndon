import { z } from "zod";

export const serviceTypeSchema = z.enum([
  "temporary_housing",
  "permanent_housing",
  "hhg",
  "car_shipment",
  "flight",
  "dsp_orientation",
  "other",
]);

export const serviceStatusSchema = z.enum([
  "pending",
  "quoted",
  "approved",
  "booked",
  "in_progress",
  "completed",
  "cancelled",
  "exception",
]);

export const listServicesSchema = z.object({
  moveId: z.string().uuid().optional(),
  type: serviceTypeSchema.optional(),
  status: serviceStatusSchema.optional(),
  vendorId: z.string().uuid().optional(),
});

export const createHhgQuoteSchema = z.object({
  moveId: z.string().uuid(),
  vendorName: z.string().min(1),
  quoteAmount: z.string(),
  budget: z.string().optional(),
  withinBudget: z.boolean(),
  inventory: z.record(z.unknown()).optional(),
});

export const createCarShipmentSchema = z.object({
  moveId: z.string().uuid(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number(),
  vin: z.string().optional(),
  desiredShipDate: z.coerce.date().optional(),
});

export const createFlightSchema = z.object({
  moveId: z.string().uuid(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  departureDate: z.coerce.date().optional(),
  returnDate: z.coerce.date().optional(),
  airline: z.string().optional(),
  class: z.string().optional(),
  price: z.string().optional(),
});

export const bookFlightSchema = z.object({
  id: z.string().uuid(),
  bookingReference: z.string().min(1),
});

