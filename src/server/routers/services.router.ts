import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  services,
  hhgQuotes,
  carShipments,
  flights,
  dspRequests,
} from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const serviceTypeSchema = z.enum([
  "temporary_housing",
  "permanent_housing",
  "hhg",
  "car_shipment",
  "flight",
  "dsp_orientation",
  "other",
]);

const serviceStatusSchema = z.enum([
  "pending",
  "quoted",
  "approved",
  "booked",
  "in_progress",
  "completed",
  "cancelled",
  "exception",
]);

export const servicesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        moveId: z.string().uuid().optional(),
        type: serviceTypeSchema.optional(),
        status: serviceStatusSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.moveId) {
        conditions.push(eq(services.moveId, input.moveId));
      }
      if (input.type) {
        conditions.push(eq(services.type, input.type));
      }
      if (input.status) {
        conditions.push(eq(services.status, input.status));
      }

      const result = await ctx.db
        .select()
        .from(services)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(services.createdAt));
      return result;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [service] = await ctx.db
        .select()
        .from(services)
        .where(eq(services.id, input.id))
        .limit(1);
      if (!service) {
        throw new Error("Service not found");
      }
      return service;
    }),

  // HHG Quotes
  hhgQuotes: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(hhgQuotes)
          .where(eq(hhgQuotes.moveId, input.moveId))
          .orderBy(desc(hhgQuotes.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid(),
          vendorName: z.string().min(1),
          quoteAmount: z.string(),
          budget: z.string().optional(),
          withinBudget: z.boolean(),
          inventory: z.record(z.unknown()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [newQuote] = await ctx.db
          .insert(hhgQuotes)
          .values({
            moveId: input.moveId,
            vendorName: input.vendorName,
            quoteAmount: input.quoteAmount,
            budget: input.budget,
            withinBudget: input.withinBudget,
            inventory: input.inventory,
          })
          .returning();
        return newQuote;
      }),

    select: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(hhgQuotes)
          .set({
            selected: true,
            updatedAt: new Date(),
          })
          .where(eq(hhgQuotes.id, input.id))
          .returning();
        if (!updated) {
          throw new Error("HHG quote not found");
        }
        return updated;
      }),
  }),

  // Car Shipments
  carShipments: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(carShipments)
          .where(eq(carShipments.moveId, input.moveId))
          .orderBy(desc(carShipments.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid(),
          make: z.string().min(1),
          model: z.string().min(1),
          year: z.number(),
          vin: z.string().optional(),
          desiredShipDate: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [newShipment] = await ctx.db
          .insert(carShipments)
          .values({
            moveId: input.moveId,
            make: input.make,
            model: input.model,
            year: input.year,
            vin: input.vin,
            desiredShipDate: input.desiredShipDate,
          })
          .returning();
        return newShipment;
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          status: serviceStatusSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(carShipments)
          .set({
            status: input.status,
            updatedAt: new Date(),
          })
          .where(eq(carShipments.id, input.id))
          .returning();
        if (!updated) {
          throw new Error("Car shipment not found");
        }
        return updated;
      }),
  }),

  // Flights
  flights: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(flights)
          .where(eq(flights.moveId, input.moveId))
          .orderBy(desc(flights.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid(),
          origin: z.string().min(1),
          destination: z.string().min(1),
          departureDate: z.date().optional(),
          returnDate: z.date().optional(),
          airline: z.string().optional(),
          class: z.string().optional(),
          price: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [newFlight] = await ctx.db
          .insert(flights)
          .values({
            moveId: input.moveId,
            origin: input.origin,
            destination: input.destination,
            departureDate: input.departureDate,
            returnDate: input.returnDate,
            airline: input.airline,
            class: input.class,
            price: input.price,
          })
          .returning();
        return newFlight;
      }),

    book: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          bookingReference: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(flights)
          .set({
            booked: true,
            bookingReference: input.bookingReference,
            updatedAt: new Date(),
          })
          .where(eq(flights.id, input.id))
          .returning();
        if (!updated) {
          throw new Error("Flight not found");
        }
        return updated;
      }),
  }),

  // DSP Requests
  dsp: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(dspRequests)
          .where(eq(dspRequests.moveId, input.moveId))
          .orderBy(desc(dspRequests.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid(),
          providerName: z.string().optional(),
          isPreferredProvider: z.boolean().default(false),
          arrivalDate: z.date().optional(),
          familySize: z.number().optional(),
          desiredNeighborhoods: z.array(z.string()).optional(),
          schoolNeeds: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [newRequest] = await ctx.db
          .insert(dspRequests)
          .values({
            moveId: input.moveId,
            providerName: input.providerName,
            isPreferredProvider: input.isPreferredProvider,
            arrivalDate: input.arrivalDate,
            familySize: input.familySize,
            desiredNeighborhoods: input.desiredNeighborhoods,
            schoolNeeds: input.schoolNeeds,
          })
          .returning();
        return newRequest;
      }),
  }),
});

