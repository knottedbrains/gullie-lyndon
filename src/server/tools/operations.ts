import { createTool, callTRPCProcedure } from "./builder";
import {
  createCheckInSchema,
  createPolicyExceptionSchema,
  listCheckInsSchema,
  listPolicyExceptionsSchema,
  reportServiceBreakSchema,
  updateExceptionStatusSchema,
} from "../schemas/operations";

export const listPolicyExceptionsTool = createTool("list_policy_exceptions")
  .describe("List policy exceptions requiring approval")
  .input(listPolicyExceptionsSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.operations.policyExceptions.list, args, false);
  });

export const createPolicyExceptionTool = createTool("create_policy_exception")
  .describe("Create a policy exception request")
  .input(createPolicyExceptionSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.operations.policyExceptions.create, args, true);
  });

export const updateExceptionStatusTool = createTool("update_exception_status")
  .describe("Update policy exception status (approve/deny)")
  .input(updateExceptionStatusSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.operations.policyExceptions.updateStatus, args, true);
  });

export const listCheckInsTool = createTool("list_check_ins")
  .describe("List scheduled check-ins")
  .input(listCheckInsSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.operations.checkIns.list, args, false);
  });

export const createCheckInTool = createTool("create_check_in")
  .describe("Schedule a check-in")
  .input(createCheckInSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.operations.checkIns.create, args, true);
  });

export const reportServiceBreakTool = createTool("report_service_break")
  .describe("Report a service break issue")
  .input(reportServiceBreakSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.operations.serviceBreaks.report, args, true);
  });

export const operationsTools = [
  listPolicyExceptionsTool,
  createPolicyExceptionTool,
  updateExceptionStatusTool,
  listCheckInsTool,
  createCheckInTool,
  reportServiceBreakTool,
];
