import { createTool, callTRPCProcedure } from "./builder";
import {
  bookFlightSchema,
  createCarShipmentSchema,
  createFlightSchema,
  createHhgQuoteSchema,
  listServicesSchema,
} from "../schemas/services";

export const listServicesTool = createTool("list_services")
  .describe("List all services for a move")
  .input(listServicesSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.services.list, args, false);
  });

export const createHhgQuoteTool = createTool("create_hhg_quote")
  .describe("Create a household goods (HHG) quote")
  .input(createHhgQuoteSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.services.hhgQuotes.create, args, true);
  });

export const createCarShipmentTool = createTool("create_car_shipment")
  .describe("Create a car shipment request")
  .input(createCarShipmentSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.services.carShipments.create, args, true);
  });

export const createFlightTool = createTool("create_flight")
  .describe("Create a flight booking")
  .input(createFlightSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.services.flights.create, args, true);
  });

export const bookFlightTool = createTool("book_flight")
  .describe("Book a flight with booking reference")
  .input(bookFlightSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.services.flights.book, args, true);
  });

export const servicesTools = [
  listServicesTool,
  createHhgQuoteTool,
  createCarShipmentTool,
  createFlightTool,
  bookFlightTool,
];
