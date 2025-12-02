import { z } from "zod";

export const paymentStatusSchema = z.enum(["pending", "paid", "disputed"]);

export const listInvoicesSchema = z.object({
  moveId: z.string().uuid().optional(),
  employerId: z.string().uuid().optional(),
  paymentStatus: paymentStatusSchema.optional(),
});

export const createInvoiceSchema = z.object({
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
});

export const updatePaymentStatusSchema = z.object({
  id: z.string().uuid(),
  paymentStatus: paymentStatusSchema,
});

export const listTaxGrossUpsSchema = z.object({
  moveId: z.string().uuid(),
});

export const calculateTaxGrossUpSchema = z.object({
  moveId: z.string().uuid(),
  serviceType: z.string().min(1),
  serviceCost: z.string(),
  country: z.string().min(1),
  state: z.string().optional(),
  employeeIncomeLevel: z.string().optional(),
  employerCoversGrossUp: z.boolean().default(false),
});

export const approveTaxGrossUpSchema = z.object({
  id: z.string().uuid(),
});

