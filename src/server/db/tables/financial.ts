import { pgTable, text, timestamp, uuid, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { employers } from "./core";

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  employerId: uuid("employer_id").references(() => employers.id).notNull(),
  invoiceNumber: text("invoice_number").unique().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  gullieFee: decimal("gullie_fee", { precision: 10, scale: 2 }).notNull(),
  grossUpAmount: decimal("gross_up_amount", { precision: 10, scale: 2 }),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  vendorReceipts: jsonb("vendor_receipts").$type<Array<{
    vendor: string;
    service: string;
    amount: string;
    receiptUrl?: string;
  }>>().default([]),
  serviceSummary: jsonb("service_summary").$type<Array<{
    service: string;
    vendor: string;
    date: string;
    amount: string;
  }>>().default([]),
  paymentStatus: text("payment_status").$type<"pending" | "paid" | "disputed">().default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const taxGrossUps = pgTable("tax_gross_ups", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  serviceType: text("service_type").notNull(),
  serviceCost: decimal("service_cost", { precision: 10, scale: 2 }).notNull(),
  country: text("country").notNull(),
  state: text("state"),
  employeeIncomeLevel: text("employee_income_level"),
  grossUpAmount: decimal("gross_up_amount", { precision: 10, scale: 2 }),
  employerCoversGrossUp: boolean("employer_covers_gross_up").default(false).notNull(),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

