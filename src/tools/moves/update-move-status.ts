import { z } from "zod";
import { type InferSchema } from "xmcp";
import { trpc } from "@/mcp/trpc-client";

export const schema = {
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
};

export const metadata = {
  name: "update_move_status",
  description: "Update the status of a move",
};

export default async function updateMoveStatus(args: InferSchema<typeof schema>) {
  const result = await trpc.moves.updateStatus.mutate({
    id: args.id,
    status: args.status,
  });
  return JSON.stringify(result, null, 2);
}

