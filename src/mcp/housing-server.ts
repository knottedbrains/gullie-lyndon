import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { trpc } from "./trpc-client";

export async function createHousingServer() {
  const server = new McpServer(
    {
      name: "gullie-housing-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.registerTool(
    "search_housing",
    {
      description: "Search for housing options for a move",
      inputSchema: z.object({
        moveId: z.string().uuid().describe("Move ID"),
        city: z.string().optional().describe("Filter by city"),
        maxCommute: z.number().optional().describe("Maximum commute time in minutes"),
        budget: z.string().optional().describe("Maximum budget"),
      }),
    },
    async (args) => {
      const result = await trpc.housing.search.query({
        moveId: args.moveId,
        city: args.city,
        maxCommute: args.maxCommute,
        budget: args.budget,
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
    "list_housing_options",
    {
      description: "List housing options with filters",
      inputSchema: z.object({
        moveId: z.string().uuid().optional().describe("Move ID"),
        type: z.enum([
          "hotel",
          "serviced_apartment",
          "airbnb",
          "apartment",
          "condo",
          "single_family_home",
        ]).optional().describe("Filter by housing type"),
        isTemporary: z.boolean().optional().describe("Filter by temporary vs permanent"),
        matchCategory: z.enum(["optimal", "strong", "essential"]).optional().describe("Filter by match category"),
      }),
    },
    async (args) => {
      const result = await trpc.housing.list.query({
        moveId: args.moveId,
        type: args.type,
        isTemporary: args.isTemporary,
        matchCategory: args.matchCategory,
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
    "create_housing_option",
    {
      description: "Create a new housing option",
      inputSchema: z.object({
        moveId: z.string().uuid().describe("Move ID"),
        type: z.enum([
          "hotel",
          "serviced_apartment",
          "airbnb",
          "apartment",
          "condo",
          "single_family_home",
        ]).describe("Housing type"),
        isTemporary: z.boolean().describe("Is temporary housing"),
        address: z.string().describe("Address"),
        city: z.string().describe("City"),
        state: z.string().optional().describe("State"),
        zipCode: z.string().optional().describe("Zip code"),
        price: z.string().describe("Price"),
        pricePerMonth: z.string().optional().describe("Price per month"),
        pricePerNight: z.string().optional().describe("Price per night"),
        commuteToOffice: z.number().optional().describe("Commute time in minutes"),
        commuteMode: z.string().optional().describe("Commute mode"),
        parkingAvailable: z.boolean().default(false).describe("Parking available"),
        matchCategory: z.enum(["optimal", "strong", "essential"]).optional().describe("Match category"),
      }),
    },
    async (args) => {
      const result = await trpc.housing.create.mutate({
        moveId: args.moveId,
        type: args.type,
        isTemporary: args.isTemporary,
        address: args.address,
        city: args.city,
        state: args.state,
        zipCode: args.zipCode,
        price: args.price,
        pricePerMonth: args.pricePerMonth,
        pricePerNight: args.pricePerNight,
        commuteToOffice: args.commuteToOffice,
        commuteMode: args.commuteMode,
        parkingAvailable: args.parkingAvailable ?? false,
        matchCategory: args.matchCategory,
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
    "select_housing",
    {
      description: "Select a housing option for a move",
      inputSchema: z.object({
        id: z.string().uuid().describe("Housing option ID"),
      }),
    },
    async (args) => {
      const result = await trpc.housing.select.mutate({
        id: args.id,
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
