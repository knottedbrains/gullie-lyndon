import { z } from "zod";
import { type InferSchema } from "xmcp";
import { trpc } from "@/mcp/trpc-client";

export const schema = {
  id: z.string().uuid().describe("Move ID"),
};

export const metadata = {
  name: "get_move",
  description: "Get details of a specific move by ID",
};

export default async function getMove(args: InferSchema<typeof schema>) {
  const result = await trpc.moves.getById.query({ id: args.id });
  return JSON.stringify(result, null, 2);
}

