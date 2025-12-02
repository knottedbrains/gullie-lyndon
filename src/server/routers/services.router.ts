import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  services,
  hhgQuotes,
  carShipments,
  flights,
  dspRequests,
  moves,
  vendors,
} from "../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  bookFlightSchema,
  createCarShipmentSchema,
  createFlightSchema,
  createHhgQuoteSchema,
  listServicesSchema,
  serviceStatusSchema,
} from "../schemas/services";

export const servicesRouter = createTRPCRouter({
  list: publicProcedure
    .input(listServicesSchema)
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
      if (input.vendorId) {
        conditions.push(eq(services.vendorId, input.vendorId));
      }

      // Role-based filtering
      if (ctx.user) {
        if (ctx.user.role === "vendor") {
          // For vendors, filter by vendorId
          // Note: This assumes vendor users have a vendorId - would need to be added to users table
          // For now, we'll filter by vendorName matching the user's name or email
          // In production, you'd link users to vendors via vendorId
        } else if (ctx.user.role === "company" && ctx.user.employerId) {
          // For companies, filter services by their moves
          // This requires a join with moves table
          const companyMoves = await ctx.db
            .select({ id: moves.id })
            .from(moves)
            .where(eq(moves.employerId, ctx.user.employerId));
          
          if (companyMoves.length > 0) {
            const moveIds = companyMoves.map(m => m.id);
            conditions.push(inArray(services.moveId, moveIds));
          } else {
            // No moves for this company, return empty
            return [];
          }
        }
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
      .input(createHhgQuoteSchema)
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
      .input(createCarShipmentSchema)
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
      .input(createFlightSchema)
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
      .input(bookFlightSchema)
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

  // Assign vendor to service (admin only)
  assignVendor: publicProcedure
    .input(
      z.object({
        serviceId: z.string().uuid(),
        vendorId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Access denied. Admin role required.");
      }

      // Verify vendor exists
      const [vendor] = await ctx.db
        .select()
        .from(vendors)
        .where(eq(vendors.id, input.vendorId))
        .limit(1);
      
      if (!vendor) {
        throw new Error("Vendor not found");
      }

      // Update service with vendor assignment
      const [updated] = await ctx.db
        .update(services)
        .set({
          vendorId: input.vendorId,
          vendorName: vendor.name, // Keep vendorName in sync for backward compatibility
          updatedAt: new Date(),
        })
        .where(eq(services.id, input.serviceId))
        .returning();

      if (!updated) {
        throw new Error("Service not found");
      }

      return updated;
    }),

  // Unassign vendor from service (admin only)
  unassignVendor: publicProcedure
    .input(
      z.object({
        serviceId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Access denied. Admin role required.");
      }

      // Update service to remove vendor assignment
      const [updated] = await ctx.db
        .update(services)
        .set({
          vendorId: null,
          updatedAt: new Date(),
        })
        .where(eq(services.id, input.serviceId))
        .returning();

      if (!updated) {
        throw new Error("Service not found");
      }

      return updated;
    }),
});
