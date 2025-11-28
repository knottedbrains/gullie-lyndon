import { z } from "zod";
import { type InferSchema } from "xmcp";
import { trpc } from "@/mcp/trpc-client";

export const schema = {
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
};

export const metadata = {
  name: "update_lifestyle_intake",
  description: "Update lifestyle intake information for a move",
};

export default async function updateLifestyleIntake(args: InferSchema<typeof schema>) {
  const result = await trpc.moves.update.mutate({
    id: args.id,
    lifestyleIntakeCompleted: true,
    householdComposition: args.householdComposition,
    housingPreferences: args.housingPreferences,
  });
  return JSON.stringify(result, null, 2);
}

