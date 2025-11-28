import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { trpc } from "./trpc-client";

export async function createOperationsServer() {
  const server = new McpServer(
    {
      name: "gullie-operations-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.registerTool(
    "list_policy_exceptions",
    {
      description: "List policy exceptions requiring approval",
      inputSchema: z.object({
        moveId: z.string().uuid().optional().describe("Move ID"),
        status: z.enum(["pending", "approved", "denied"]).optional().describe("Exception status"),
      }),
    },
    async (args) => {
      const result = await trpc.operations.policyExceptions.list.query({
        moveId: args.moveId,
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
    "create_policy_exception",
    {
      description: "Create a policy exception request",
      inputSchema: z.object({
        moveId: z.string().uuid().describe("Move ID"),
        serviceId: z.string().uuid().optional().describe("Service ID"),
        serviceType: z.string().describe("Service type"),
        requestedService: z.string().describe("Requested service"),
      }),
    },
    async (args) => {
      const result = await trpc.operations.policyExceptions.create.mutate({
        moveId: args.moveId,
        serviceId: args.serviceId,
        serviceType: args.serviceType,
        requestedService: args.requestedService,
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
    "update_exception_status",
    {
      description: "Update policy exception status (approve/deny)",
      inputSchema: z.object({
        id: z.string().uuid().describe("Exception ID"),
        status: z.enum(["approved", "denied"]).describe("New status"),
        employerDecision: z.string().optional().describe("Reason for decision"),
      }),
    },
    async (args) => {
      const result = await trpc.operations.policyExceptions.updateStatus.mutate({
        id: args.id,
        status: args.status,
        employerDecision: args.employerDecision,
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
    "list_check_ins",
    {
      description: "List scheduled check-ins",
      inputSchema: z.object({
        moveId: z.string().uuid().optional().describe("Move ID"),
        upcoming: z.boolean().optional().describe("Only show upcoming check-ins"),
      }),
    },
    async (args) => {
      const result = await trpc.operations.checkIns.list.query({
        moveId: args.moveId,
        upcoming: args.upcoming,
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
    "create_check_in",
    {
      description: "Schedule a check-in",
      inputSchema: z.object({
        moveId: z.string().uuid().describe("Move ID"),
        serviceId: z.string().uuid().optional().describe("Service ID"),
        checkInType: z.enum(["t_minus_48", "day_of", "t_plus_48"]).describe("Check-in type"),
        scheduledAt: z.string().describe("Scheduled time in ISO format"),
      }),
    },
    async (args) => {
      const result = await trpc.operations.checkIns.create.mutate({
        moveId: args.moveId,
        serviceId: args.serviceId,
        checkInType: args.checkInType,
        scheduledAt: new Date(args.scheduledAt),
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
    "report_service_break",
    {
      description: "Report a service break issue",
      inputSchema: z.object({
        serviceId: z.string().uuid().describe("Service ID"),
        description: z.string().describe("Description of the issue"),
      }),
    },
    async (args) => {
      const result = await trpc.operations.serviceBreaks.report.mutate({
        serviceId: args.serviceId,
        description: args.description,
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
