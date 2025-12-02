import { z } from "zod";

export const exceptionStatusSchema = z.enum(["pending", "approved", "denied"]);

export const checkInTypeSchema = z.enum(["t_minus_48", "day_of", "t_plus_48"]);

export const listPolicyExceptionsSchema = z.object({
  moveId: z.string().uuid().optional(),
  status: exceptionStatusSchema.optional(),
});

export const createPolicyExceptionSchema = z.object({
  moveId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  serviceType: z.string().min(1),
  requestedService: z.string().min(1),
});

export const updateExceptionStatusSchema = z.object({
  id: z.string().uuid(),
  status: exceptionStatusSchema,
  employerDecision: z.string().optional(),
});

export const listCheckInsSchema = z.object({
  moveId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  checkInType: checkInTypeSchema.optional(),
  upcoming: z.boolean().optional(),
});

export const createCheckInSchema = z.object({
  moveId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  checkInType: checkInTypeSchema,
  scheduledAt: z.coerce.date(),
});

export const completeCheckInSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().optional(),
});

export const listServiceBreaksSchema = z.object({
  moveId: z.string().uuid().optional(),
});

export const reportServiceBreakSchema = z.object({
  serviceId: z.string().uuid(),
  description: z.string().min(1),
});

export const addRemediationSchema = z.object({
  serviceId: z.string().uuid(),
  remediationPlan: z.string().min(1),
});

