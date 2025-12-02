import { z } from "zod";
import { createTool, callTRPCProcedure } from "../../server/tools/builder";
import {
  createMoveSchema,
  createTestMoveSchema,
  listMovesSchema,
  moveStatusSchema,
  updateMoveSchema,
} from "../../server/schemas/moves";

export const listMovesTool = createTool("list_moves")
  .describe("List all moves with optional filtering by status or employer")
  .input(listMovesSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.moves.list, args, false);
  });

export const getMoveTool = createTool("get_move")
  .describe("Get details of a specific move by ID")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.moves.getById, args, false);
  });

export const createMoveTool = createTool("create_move")
  .describe(
    "Create a new move/relocation. Requires existing employee and employer IDs."
  )
  .input(createMoveSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.moves.create, args, true);
  });

export const createTestMoveTool = createTool("create_test_move")
  .describe(
    "Create a test move with auto-generated employee and employer. Use this when the user wants to create a move without providing UUIDs. Automatically creates employee and employer records if needed. " +
    "When parsing from emails or user requests: " +
    "- For city names, expand abbreviations (e.g., 'sf' -> 'San Francisco', 'ny' -> 'New York', 'uk' -> 'UK' or 'United Kingdom'). " +
    "- For employee names, use the full name as provided (e.g., 'lyndon leong' -> 'Lyndon Leong'). " +
    "- For employer names, use the company name as provided (e.g., 'janestreet' -> 'Jane Street'). " +
    "All parameters are optional and will use sensible defaults if not provided."
  )
  .input(createTestMoveSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.moves.createTestMove, args, true);
  });

export const updateMoveStatusTool = createTool("update_move_status")
  .describe("Update the status of a move")
  .input(
    z.object({
      id: z.string().uuid(),
      status: moveStatusSchema,
    })
  )
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.moves.updateStatus, args, true);
  });

export const updateLifestyleIntakeTool = createTool("update_lifestyle_intake")
  .describe("Update lifestyle intake information for a move")
  .input(
    z.object({
      id: z.string().uuid(),
      householdComposition: updateMoveSchema.shape.householdComposition,
      housingPreferences: updateMoveSchema.shape.housingPreferences,
    })
  )
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.moves.update, {
      id: args.id,
      lifestyleIntakeCompleted: true,
      householdComposition: args.householdComposition,
      housingPreferences: args.housingPreferences,
    }, true);
  });

export const updateMoveEmployerTool = createTool("update_move_employer")
  .describe("Update the employer/company for a specific move. If the employer doesn't exist, it will be created.")
  .input(
    z.object({
      moveId: z.string().uuid(),
      employerName: z.string().describe("The name of the employer (e.g. 'Jane Street')"),
      employerEmail: z.string().email().optional().describe("Optional email for the employer's HR contact"),
    })
  )
  .handler(async (args, { trpc }) => {
    const result = await callTRPCProcedure(trpc.moves.updateEmployer, args, true);
    if (!result) {
        throw new Error("Failed to update employer");
    }
    return result;
  });

export const mcpMovesTools = [
  listMovesTool,
  getMoveTool,
  createMoveTool,
  createTestMoveTool,
  updateMoveStatusTool,
  updateLifestyleIntakeTool,
  updateMoveEmployerTool,
];

