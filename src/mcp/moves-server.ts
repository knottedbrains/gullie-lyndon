import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { trpc } from "./trpc-client";

export async function createMovesServer() {
  const server = new McpServer(
    {
      name: "gullie-moves-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.registerTool(
    "list_moves",
    {
      description: "List all moves with optional filtering by status or employer",
      inputSchema: z.object({
        limit: z.number().default(50).describe("Maximum number of moves to return"),
        offset: z.number().default(0).describe("Offset for pagination"),
        status: z.enum([
          "initiated",
          "intake_in_progress",
          "housing_search",
          "services_booked",
          "in_transit",
          "completed",
          "cancelled",
        ]).optional().describe("Filter by move status"),
        employerId: z.string().uuid().optional().describe("Filter by employer ID"),
      }),
    },
    async (args) => {
      const result = await trpc.moves.list.query({
        limit: args.limit ?? 50,
        offset: args.offset ?? 0,
        status: args.status,
        employerId: args.employerId,
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
    "get_move",
    {
      description: "Get details of a specific move by ID",
      inputSchema: z.object({
        id: z.string().uuid().describe("Move ID"),
      }),
    },
    async (args) => {
      const result = await trpc.moves.getById.query({
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

  server.registerTool(
    "create_move",
    {
      description: "Create a new move/relocation",
      inputSchema: z.object({
        employeeId: z.string().uuid().describe("Employee ID"),
        employerId: z.string().uuid().describe("Employer ID"),
        policyId: z.string().uuid().optional().describe("Policy ID"),
        originCity: z.string().describe("Origin city"),
        destinationCity: z.string().describe("Destination city"),
        officeLocation: z.string().describe("Office location"),
        programType: z.string().optional().describe("Program type"),
        benefitAmount: z.string().optional().describe("Benefit amount"),
        moveDate: z.string().optional().describe("Move date in ISO format"),
      }),
    },
    async (args) => {
      const result = await trpc.moves.create.mutate({
        employeeId: args.employeeId,
        employerId: args.employerId,
        policyId: args.policyId,
        originCity: args.originCity,
        destinationCity: args.destinationCity,
        officeLocation: args.officeLocation,
        programType: args.programType,
        benefitAmount: args.benefitAmount,
        moveDate: args.moveDate ? new Date(args.moveDate) : undefined,
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
    "update_move_status",
    {
      description: "Update the status of a move",
      inputSchema: z.object({
        id: z.string().uuid().describe("Move ID"),
        status: z.enum([
          "initiated",
          "intake_in_progress",
          "housing_search",
          "services_booked",
          "in_transit",
          "completed",
          "cancelled",
        ]).describe("New status"),
      }),
    },
    async (args) => {
      const result = await trpc.moves.updateStatus.mutate({
        id: args.id,
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
    "update_lifestyle_intake",
    {
      description: "Update lifestyle intake information for a move",
      inputSchema: z.object({
        id: z.string().uuid().describe("Move ID"),
        householdComposition: z.object({
          relocatingAlone: z.boolean(),
          spousePartner: z.string().optional(),
          familyMembers: z.array(z.string()).optional(),
        }).optional(),
        housingPreferences: z.object({
          requiredCriteria: z.array(z.string()),
          niceToHaveCriteria: z.array(z.string()),
          neighborhoodPreferences: z.array(z.string()),
          hobbies: z.array(z.string()),
          walkability: z.boolean(),
          urbanRural: z.enum(["urban", "rural", "suburban"]),
          commuteDistance: z.number(),
        }).optional(),
      }),
    },
    async (args) => {
      const result = await trpc.moves.update.mutate({
        id: args.id,
        lifestyleIntakeCompleted: true,
        householdComposition: args.householdComposition,
        housingPreferences: args.housingPreferences,
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
