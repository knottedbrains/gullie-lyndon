import { z } from "zod";

export const moveStatusSchema = z.enum([
  "initiated",
  "intake_in_progress",
  "housing_search",
  "services_booked",
  "in_transit",
  "completed",
  "cancelled",
]);

export const createMoveSchema = z.object({
  employeeId: z.string().uuid(),
  employerId: z.string().uuid(),
  policyId: z.string().uuid().optional(),
  originCity: z.string().min(1),
  destinationCity: z.string().min(1),
  officeLocation: z.string().min(1),
  programType: z.string().optional(),
  benefitAmount: z.string().optional(),
  moveDate: z.coerce.date().optional(),
});

export const updateMoveSchema = z.object({
  id: z.string().uuid(),
  status: moveStatusSchema.optional(),
  lifestyleIntakeCompleted: z.boolean().optional(),
  householdComposition: z
    .object({
      relocatingAlone: z.boolean(),
      spousePartner: z.string().optional(),
      familyMembers: z.array(z.string()).optional(),
    })
    .optional(),
  housingPreferences: z
    .object({
      requiredCriteria: z.array(z.string()),
      niceToHaveCriteria: z.array(z.string()),
      neighborhoodPreferences: z.array(z.string()),
      hobbies: z.array(z.string()),
      walkability: z.boolean(),
      urbanRural: z.enum(["urban", "rural", "suburban"]),
      commuteDistance: z.number(),
    })
    .optional(),
  moveDate: z.coerce.date().optional(),
});

export const listMovesSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  status: moveStatusSchema.optional(),
  employerId: z.string().uuid().optional(),
});

export const createTestMoveSchema = z.object({
  originCity: z.string().min(1).default("San Francisco"),
  destinationCity: z.string().min(1).default("New York"),
  officeLocation: z.string().min(1).default("New York Office"),
  employeeName: z.string().optional().default("Test Employee"),
  employeeEmail: z.string().email().optional().default("test.employee@example.com"),
  employeePhone: z.string().optional().default("+1-555-0100"),
  employerName: z.string().optional().default("Test Company"),
  employerEmail: z.string().email().optional().default("hr@testcompany.com"),
  programType: z.string().optional(),
  benefitAmount: z.string().optional(),
  moveDate: z.coerce.date().optional(),
});

