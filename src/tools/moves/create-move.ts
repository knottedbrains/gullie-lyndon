import { z } from "zod";
import { type InferSchema } from "xmcp";
import { trpc } from "@/mcp/trpc-client";

export const schema = {
  employeeId: z.string().uuid().describe("Employee ID"),
  employerId: z.string().uuid().describe("Employer ID"),
  policyId: z.string().uuid().optional().describe("Policy ID"),
  originCity: z.string().min(1).describe("Origin city"),
  destinationCity: z.string().min(1).describe("Destination city"),
  officeLocation: z.string().min(1).describe("Office location"),
  programType: z.string().optional().describe("Program type"),
  benefitAmount: z.string().optional().describe("Benefit amount"),
  moveDate: z.string().datetime().optional().describe("Move date in ISO format"),
};

export const metadata = {
  name: "create_move",
  description: "Create a new move/relocation",
};

export default async function createMove(args: InferSchema<typeof schema>) {
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
  return JSON.stringify(result, null, 2);
}

