import { z } from "zod";
import { type InferSchema } from "xmcp";
import { trpc } from "@/mcp/trpc-client";

export const schema = {
  limit: z.number().min(1).max(100).default(50).describe("Maximum number of moves to return"),
  offset: z.number().min(0).default(0).describe("Offset for pagination"),
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
};

export const metadata = {
  name: "list_moves",
  description: "List all moves with optional filtering by status or employer",
};

export default async function listMoves(args: InferSchema<typeof schema>) {
  const result = await trpc.moves.list.query({
    limit: args.limit,
    offset: args.offset,
    status: args.status,
    employerId: args.employerId,
  });
  return JSON.stringify(result, null, 2);
}

