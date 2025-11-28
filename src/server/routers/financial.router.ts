import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { invoices, taxGrossUps, moves } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const paymentStatusSchema = z.enum(["pending", "paid", "disputed"]);

export const financialRouter = createTRPCRouter({
  invoices: createTRPCRouter({
    list: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid().optional(),
          employerId: z.string().uuid().optional(),
          paymentStatus: paymentStatusSchema.optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input.moveId) {
          conditions.push(eq(invoices.moveId, input.moveId));
        }
        if (input.employerId) {
          conditions.push(eq(invoices.employerId, input.employerId));
        }
        if (input.paymentStatus) {
          conditions.push(eq(invoices.paymentStatus, input.paymentStatus));
        }

        const result = await ctx.db
          .select()
          .from(invoices)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(invoices.createdAt));
        return result;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const [invoice] = await ctx.db
          .select()
          .from(invoices)
          .where(eq(invoices.id, input.id))
          .limit(1);
        if (!invoice) {
          throw new Error("Invoice not found");
        }
        return invoice;
      }),

    create: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid(),
          employerId: z.string().uuid(),
          invoiceNumber: z.string().min(1),
          subtotal: z.string(),
          gullieFee: z.string(),
          grossUpAmount: z.string().optional(),
          total: z.string(),
          vendorReceipts: z
            .array(
              z.object({
                vendor: z.string(),
                service: z.string(),
                amount: z.string(),
                receiptUrl: z.string().optional(),
              })
            )
            .optional(),
          serviceSummary: z
            .array(
              z.object({
                service: z.string(),
                vendor: z.string(),
                date: z.string(),
                amount: z.string(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [newInvoice] = await ctx.db
          .insert(invoices)
          .values({
            moveId: input.moveId,
            employerId: input.employerId,
            invoiceNumber: input.invoiceNumber,
            subtotal: input.subtotal,
            gullieFee: input.gullieFee,
            grossUpAmount: input.grossUpAmount,
            total: input.total,
            vendorReceipts: input.vendorReceipts || [],
            serviceSummary: input.serviceSummary || [],
          })
          .returning();
        return newInvoice;
      }),

    updatePaymentStatus: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          paymentStatus: paymentStatusSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(invoices)
          .set({
            paymentStatus: input.paymentStatus,
            paidAt: input.paymentStatus === "paid" ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, input.id))
          .returning();
        if (!updated) {
          throw new Error("Invoice not found");
        }
        return updated;
      }),
  }),

  taxGrossUps: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(taxGrossUps)
          .where(eq(taxGrossUps.moveId, input.moveId))
          .orderBy(desc(taxGrossUps.createdAt));
        return result;
      }),

    calculate: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid(),
          serviceType: z.string().min(1),
          serviceCost: z.string(),
          country: z.string().min(1),
          state: z.string().optional(),
          employeeIncomeLevel: z.string().optional(),
          employerCoversGrossUp: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Simplified gross-up calculation - in production, this would use a tax service
        const serviceCost = parseFloat(input.serviceCost);
        const grossUpAmount = input.employerCoversGrossUp
          ? serviceCost * 0.3 // Simplified 30% gross-up estimate
          : null;

        const [newGrossUp] = await ctx.db
          .insert(taxGrossUps)
          .values({
            moveId: input.moveId,
            serviceType: input.serviceType,
            serviceCost: input.serviceCost,
            country: input.country,
            state: input.state,
            employeeIncomeLevel: input.employeeIncomeLevel,
            employerCoversGrossUp: input.employerCoversGrossUp,
            grossUpAmount: grossUpAmount?.toString(),
          })
          .returning();
        return newGrossUp;
      }),

    approve: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(taxGrossUps)
          .set({
            approved: true,
            updatedAt: new Date(),
          })
          .where(eq(taxGrossUps.id, input.id))
          .returning();
        if (!updated) {
          throw new Error("Tax gross-up not found");
        }
        return updated;
      }),
  }),
});

