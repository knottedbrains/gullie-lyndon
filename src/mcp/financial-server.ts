import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { trpc } from "./trpc-client";

export async function createFinancialServer() {
  const server = new McpServer(
    {
      name: "gullie-financial-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.registerTool(
    "list_invoices",
    {
      description: "List invoices with optional filters",
      inputSchema: z.object({
        moveId: z.string().uuid().optional().describe("Move ID"),
        employerId: z.string().uuid().optional().describe("Employer ID"),
        paymentStatus: z.enum(["pending", "paid", "disputed"]).optional().describe("Payment status"),
      }),
    },
    async (args) => {
      const result = await trpc.financial.invoices.list.query({
        moveId: args.moveId,
        employerId: args.employerId,
        paymentStatus: args.paymentStatus,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "create_invoice",
    {
      description: "Create a new invoice",
      inputSchema: z.object({
        moveId: z.string().uuid().describe("Move ID"),
        employerId: z.string().uuid().describe("Employer ID"),
        invoiceNumber: z.string().describe("Invoice number"),
        subtotal: z.string().describe("Subtotal"),
        gullieFee: z.string().describe("Gullie fee"),
        grossUpAmount: z.string().optional().describe("Gross-up amount"),
        total: z.string().describe("Total"),
      }),
    },
    async (args) => {
      const result = await trpc.financial.invoices.create.mutate({
        moveId: args.moveId,
        employerId: args.employerId,
        invoiceNumber: args.invoiceNumber,
        subtotal: args.subtotal,
        gullieFee: args.gullieFee,
        grossUpAmount: args.grossUpAmount,
        total: args.total,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "calculate_tax_grossup",
    {
      description: "Calculate tax gross-up for a service",
      inputSchema: z.object({
        moveId: z.string().uuid().describe("Move ID"),
        serviceType: z.string().describe("Service type"),
        serviceCost: z.string().describe("Service cost"),
        country: z.string().describe("Country"),
        state: z.string().optional().describe("State"),
        employeeIncomeLevel: z.string().optional().describe("Employee income level"),
        employerCoversGrossUp: z.boolean().default(false).describe("Employer covers gross-up"),
      }),
    },
    async (args) => {
      const result = await trpc.financial.taxGrossUps.calculate.mutate({
        moveId: args.moveId,
        serviceType: args.serviceType,
        serviceCost: args.serviceCost,
        country: args.country,
        state: args.state,
        employeeIncomeLevel: args.employeeIncomeLevel,
        employerCoversGrossUp: args.employerCoversGrossUp ?? false,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  return server;
}
