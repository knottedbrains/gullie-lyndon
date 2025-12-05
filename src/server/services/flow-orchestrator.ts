import { executeToolCall } from "./openai-service";

/**
 * Flow Orchestration System
 *
 * Allows defining multi-step workflows where tool outputs feed into subsequent tools.
 * Each step can have conditions and data transformations.
 */

export type FlowStep = {
  name: string;
  tool: string;
  arguments: Record<string, unknown> | ((context: FlowContext) => Record<string, unknown>);
  condition?: (context: FlowContext) => boolean;
  transform?: (result: any, context: FlowContext) => any;
};

export type FlowDefinition = {
  name: string;
  description: string;
  steps: FlowStep[];
};

export type FlowContext = {
  input: Record<string, unknown>;
  results: Record<string, any>;
  stepIndex: number;
};

export type FlowResult = {
  success: boolean;
  steps: Array<{
    name: string;
    tool: string;
    arguments: Record<string, unknown>;
    result: any;
    skipped?: boolean;
  }>;
  finalResult?: any;
  error?: string;
};

// Flow Registry
const flowRegistry: Map<string, FlowDefinition> = new Map();
let initialized = false;

/**
 * Register a flow definition
 */
function registerFlow(flow: FlowDefinition): void {
  flowRegistry.set(flow.name, flow);
}

/**
 * Initialize all predefined flows (lazy initialization on first use)
 */
function initializeFlows(): void {
  if (initialized) return;

  initialized = true;

  // ============================================================================
  // Predefined Flows
  // ============================================================================

  /**
   * Flow: Complete Relocation
   * Creates a move, searches for housing, and requests essential services
   */
  registerFlow({
    name: "complete_relocation",
    description:
      "Complete end-to-end relocation: create move, search housing, request services",
    steps: [
      {
        name: "create_move",
        tool: "create_move",
        arguments: (ctx) => ({
          employeeName: ctx.input.employeeName,
          employeeEmail: ctx.input.employeeEmail,
          fromLocation: ctx.input.fromLocation,
          toLocation: ctx.input.toLocation,
          moveDate: ctx.input.moveDate,
          companyName: ctx.input.companyName,
        }),
      },
      {
        name: "search_housing",
        tool: "search_housing",
        arguments: (ctx) => ({
          location: ctx.input.toLocation,
          budget: ctx.input.housingBudget || 3000,
          bedrooms: ctx.input.bedrooms || 2,
          moveId: ctx.results.create_move?.move?.id,
        }),
      },
      {
        name: "request_moving_service",
        tool: "request_service",
        arguments: (ctx) => ({
          moveId: ctx.results.create_move?.move?.id,
          serviceType: "moving",
          notes: "Full-service moving requested",
        }),
        condition: (ctx) => !!ctx.results.create_move?.move?.id,
      },
      {
        name: "request_visa_service",
        tool: "request_service",
        arguments: (ctx) => ({
          moveId: ctx.results.create_move?.move?.id,
          serviceType: "visa",
          notes: "Visa assistance requested",
        }),
        condition: (ctx) =>
          !!ctx.results.create_move?.move?.id &&
          ctx.input.needsVisa === true,
      },
    ],
  });

  /**
   * Flow: Housing Search
   * Search housing based on preferences and optionally select one
   */
  registerFlow({
    name: "housing_search",
    description: "Search and select housing based on preferences",
    steps: [
      {
        name: "search_housing",
        tool: "search_housing",
        arguments: (ctx) => ({
          location: ctx.input.location,
          budget: ctx.input.budget || 3000,
          bedrooms: ctx.input.bedrooms || 2,
          moveId: ctx.input.moveId,
        }),
      },
      {
        name: "select_housing",
        tool: "select_housing",
        arguments: (ctx) => ({
          moveId: ctx.input.moveId,
          housingId: ctx.input.housingId || ctx.results.search_housing?.options?.[0]?.id,
        }),
        condition: (ctx) =>
          !!ctx.input.housingId || ctx.results.search_housing?.options?.length > 0,
      },
    ],
  });

  /**
   * Flow: Invoice and Payment
   * Create invoice, calculate tax grossup, and send payment request
   */
  registerFlow({
    name: "invoice_and_pay",
    description: "Create invoice, calculate tax grossup, and send payment request",
    steps: [
      {
        name: "create_invoice",
        tool: "create_invoice",
        arguments: (ctx) => ({
          moveId: ctx.input.moveId,
          description: ctx.input.description || "Relocation services",
          amount: ctx.input.amount,
          dueDate: ctx.input.dueDate,
        }),
      },
      {
        name: "calculate_grossup",
        tool: "calculate_tax_grossup",
        arguments: (ctx) => ({
          netAmount: ctx.input.amount,
          taxRate: ctx.input.taxRate || 0.3,
        }),
      },
      {
        name: "send_invoice_email",
        tool: "send_email",
        arguments: (ctx) => ({
          to: ctx.input.employeeEmail,
          subject: `Invoice for Relocation Services`,
          body: `Your invoice has been created.\n\nAmount: $${ctx.input.amount}\nGross Amount (after tax): $${ctx.results.calculate_grossup?.grossAmount}\nDue Date: ${ctx.input.dueDate}\n\nPlease review and approve.`,
        }),
        condition: (ctx) => !!ctx.input.employeeEmail,
      },
    ],
  });

  /**
   * Flow: Move and Housing Chain (Demo)
   * Demonstrates tool chaining: Create move → Search housing → Request housing service
   * Perfect for showing multiple tools working together!
   */
  registerFlow({
    name: "move_housing_chain",
    description: "Demo: Create move → Search housing → Request housing service",
    steps: [
      {
        name: "create_move",
        tool: "create_move",
        arguments: (ctx) => ({
          employeeName: ctx.input.employeeName || "Lyndon Leong",
          employeeEmail: ctx.input.employeeEmail || "test.employee@example.com",
          fromLocation: ctx.input.fromLocation || "United Kingdom",
          toLocation: ctx.input.toLocation || "San Francisco",
          companyName: ctx.input.companyName || "Test Company",
          moveDate: ctx.input.moveDate,
        }),
      },
      {
        name: "search_housing",
        tool: "search_housing",
        arguments: (ctx) => ({
          location: ctx.input.toLocation || "San Francisco",
          budget: ctx.input.budget || 3500,
          bedrooms: ctx.input.bedrooms || 2,
          moveId: ctx.results.create_move?.move?.id,
        }),
        condition: (ctx) => !!ctx.results.create_move?.move?.id,
      },
      {
        name: "request_housing_service",
        tool: "request_service",
        arguments: (ctx) => ({
          moveId: ctx.results.create_move?.move?.id,
          serviceType: "permanent_housing",
          notes: `Housing search completed. Budget: $${ctx.input.budget || 3500}/month, ${ctx.input.bedrooms || 2} bedrooms. Found ${ctx.results.search_housing?.options?.length || 0} options.`,
        }),
        condition: (ctx) => !!ctx.results.create_move?.move?.id,
      },
    ],
  });

  console.log(`🌊 [Flow] Initialized with ${flowRegistry.size} flows`);
}

/**
 * Execute a flow by name
 */
export async function executeFlow(
  flowName: string,
  input: Record<string, unknown>,
  sessionId?: string,
  trpcCaller?: any
): Promise<FlowResult> {
  initializeFlows();

  const flow = flowRegistry.get(flowName);
  if (!flow) {
    return {
      success: false,
      steps: [],
      error: `Flow "${flowName}" not found`,
    };
  }

  console.log(`🌊 [Flow] Starting flow: ${flowName}`, { input });

  const context: FlowContext = {
    input,
    results: {},
    stepIndex: 0,
  };

  const executedSteps: FlowResult["steps"] = [];

  try {
    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      context.stepIndex = i;

      // Check condition
      if (step.condition && !step.condition(context)) {
        console.log(`🌊 [Flow] Skipping step ${i}: ${step.name} (condition not met)`);
        executedSteps.push({
          name: step.name,
          tool: step.tool,
          arguments: {},
          result: null,
          skipped: true,
        });
        continue;
      }

      // Resolve arguments (can be static or dynamic)
      const args =
        typeof step.arguments === "function"
          ? step.arguments(context)
          : step.arguments;

      console.log(`🌊 [Flow] Executing step ${i}: ${step.name} (${step.tool})`, { args });

      // Execute tool
      const resultString = await executeToolCall(step.tool, args, sessionId, trpcCaller);
      let result: any;
      try {
        result = JSON.parse(resultString);
      } catch {
        result = resultString;
      }

      // Transform result if needed
      if (step.transform) {
        result = step.transform(result, context);
      }

      // Store result in context
      context.results[step.name] = result;

      executedSteps.push({
        name: step.name,
        tool: step.tool,
        arguments: args,
        result,
      });

      console.log(`✅ [Flow] Step ${i} completed: ${step.name}`);
    }

    const finalResult = context.results[flow.steps[flow.steps.length - 1]?.name];

    return {
      success: true,
      steps: executedSteps,
      finalResult,
    };
  } catch (error) {
    console.error(`❌ [Flow] Error in flow ${flowName}:`, error);
    return {
      success: false,
      steps: executedSteps,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all registered flows
 */
export function getRegisteredFlows(): FlowDefinition[] {
  initializeFlows();
  return Array.from(flowRegistry.values());
}
