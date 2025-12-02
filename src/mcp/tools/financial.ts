import { createTool, callTRPCProcedure } from "../../server/tools/builder";
import {
  calculateTaxGrossUpSchema,
  createInvoiceSchema,
  listInvoicesSchema,
} from "../../server/schemas/financial";

export const listInvoicesTool = createTool("list_invoices")
  .describe("List invoices with optional filters")
  .input(listInvoicesSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.financial.invoices.list, args, false);
  });

export const createInvoiceTool = createTool("create_invoice")
  .describe("Create a new invoice")
  .input(createInvoiceSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.financial.invoices.create, args, true);
  });

export const calculateTaxGrossUpTool = createTool("calculate_tax_grossup")
  .describe("Calculate tax gross-up for a service")
  .input(calculateTaxGrossUpSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.financial.taxGrossUps.calculate, args, true);
  });

export const mcpFinancialTools = [
  listInvoicesTool,
  createInvoiceTool,
  calculateTaxGrossUpTool,
];

