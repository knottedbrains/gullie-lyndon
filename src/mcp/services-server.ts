import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { trpc } from "./trpc-client";

export async function createServicesServer() {
  const server = new McpServer(
    {
      name: "gullie-services-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.registerTool(
    "list_services",
    {
      description: "List all services for a move",
      inputSchema: z.object({
        moveId: z.string().uuid().optional().describe("Move ID"),
        type: z.enum([
          "temporary_housing",
          "permanent_housing",
          "hhg",
          "car_shipment",
          "flight",
          "dsp_orientation",
          "other",
        ]).optional().describe("Service type"),
        status: z.enum([
          "pending",
          "quoted",
          "approved",
          "booked",
          "in_progress",
          "completed",
          "cancelled",
          "exception",
        ]).optional().describe("Service status"),
      }),
    },
    async (args) => {
      const result = await trpc.services.list.query({
        moveId: args.moveId,
        type: args.type,
        status: args.status,
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
    "create_hhg_quote",
    {
      description: "Create a household goods (HHG) quote",
      inputSchema: z.object({
        moveId: z.string().uuid().describe("Move ID"),
        vendorName: z.string().describe("Vendor name"),
        quoteAmount: z.string().describe("Quote amount"),
        budget: z.string().optional().describe("Budget"),
        withinBudget: z.boolean().describe("Within budget"),
      }),
    },
    async (args) => {
      const result = await trpc.services.hhgQuotes.create.mutate({
        moveId: args.moveId,
        vendorName: args.vendorName,
        quoteAmount: args.quoteAmount,
        budget: args.budget,
        withinBudget: args.withinBudget,
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
    "create_car_shipment",
    {
      description: "Create a car shipment request",
      inputSchema: z.object({
        moveId: z.string().uuid().describe("Move ID"),
        make: z.string().describe("Car make"),
        model: z.string().describe("Car model"),
        year: z.number().describe("Car year"),
        vin: z.string().optional().describe("VIN"),
        desiredShipDate: z.string().optional().describe("Desired ship date in ISO format"),
      }),
    },
    async (args) => {
      const result = await trpc.services.carShipments.create.mutate({
        moveId: args.moveId,
        make: args.make,
        model: args.model,
        year: args.year,
        vin: args.vin,
        desiredShipDate: args.desiredShipDate ? new Date(args.desiredShipDate) : undefined,
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
    "create_flight",
    {
      description: "Create a flight booking",
      inputSchema: z.object({
        moveId: z.string().uuid().describe("Move ID"),
        origin: z.string().describe("Origin airport/city"),
        destination: z.string().describe("Destination airport/city"),
        departureDate: z.string().optional().describe("Departure date in ISO format"),
        returnDate: z.string().optional().describe("Return date in ISO format"),
        airline: z.string().optional().describe("Airline"),
        class: z.string().optional().describe("Class"),
        price: z.string().optional().describe("Price"),
      }),
    },
    async (args) => {
      const result = await trpc.services.flights.create.mutate({
        moveId: args.moveId,
        origin: args.origin,
        destination: args.destination,
        departureDate: args.departureDate ? new Date(args.departureDate) : undefined,
        returnDate: args.returnDate ? new Date(args.returnDate) : undefined,
        airline: args.airline,
        class: args.class,
        price: args.price,
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
    "book_flight",
    {
      description: "Book a flight with booking reference",
      inputSchema: z.object({
        id: z.string().uuid().describe("Flight ID"),
        bookingReference: z.string().describe("Booking reference"),
      }),
    },
    async (args) => {
      const result = await trpc.services.flights.book.mutate({
        id: args.id,
        bookingReference: args.bookingReference,
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
