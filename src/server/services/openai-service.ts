import OpenAI from "openai";
import { trpc } from "@/mcp/trpc-client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI function parameter schema type
type OpenAIFunctionParameters = {
  type: "object";
  properties: Record<string, {
    type?: string;
    enum?: readonly string[];
    format?: string;
    description: string;
  }>;
  required?: string[];
};

// Map workflow to available tools
const workflowTools: Record<
  string,
  Array<{
    name: string;
    description: string;
    parameters: OpenAIFunctionParameters;
  }>
> = {
  moves: [
    {
      name: "list_moves",
      description: "List all moves with optional filtering by status or employer",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of moves to return" },
          offset: { type: "number", description: "Offset for pagination" },
          status: {
            type: "string",
            enum: [
              "initiated",
              "intake_in_progress",
              "housing_search",
              "services_booked",
              "in_transit",
              "completed",
              "cancelled",
            ],
            description: "Filter by move status",
          },
          employerId: { type: "string", format: "uuid", description: "Filter by employer ID" },
        },
      },
    },
    {
      name: "get_move",
      description: "Get details of a specific move by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Move ID" },
        },
        required: ["id"],
      },
    },
    {
      name: "create_move",
      description: "Create a new move/relocation",
      parameters: {
        type: "object",
        properties: {
          employeeId: { type: "string", format: "uuid", description: "Employee ID" },
          employerId: { type: "string", format: "uuid", description: "Employer ID" },
          policyId: { type: "string", format: "uuid", description: "Policy ID" },
          originCity: { type: "string", description: "Origin city" },
          destinationCity: { type: "string", description: "Destination city" },
          officeLocation: { type: "string", description: "Office location" },
          programType: { type: "string", description: "Program type" },
          benefitAmount: { type: "string", description: "Benefit amount" },
          moveDate: { type: "string", format: "date-time", description: "Move date in ISO format" },
        },
        required: ["employeeId", "employerId", "originCity", "destinationCity", "officeLocation"],
      },
    },
    {
      name: "update_move_status",
      description: "Update the status of a move",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Move ID" },
          status: {
            type: "string",
            enum: [
              "initiated",
              "intake_in_progress",
              "housing_search",
              "services_booked",
              "in_transit",
              "completed",
              "cancelled",
            ],
            description: "New status",
          },
        },
        required: ["id", "status"],
      },
    },
  ],
  housing: [
    {
      name: "search_housing",
      description: "Search for housing options for a move",
      parameters: {
        type: "object",
        properties: {
          moveId: { type: "string", format: "uuid", description: "Move ID" },
          city: { type: "string", description: "Filter by city" },
          maxCommute: { type: "number", description: "Maximum commute time in minutes" },
          budget: { type: "string", description: "Maximum budget" },
        },
        required: ["moveId"],
      },
    },
    {
      name: "list_housing_options",
      description: "List housing options with filters",
      parameters: {
        type: "object",
        properties: {
          moveId: { type: "string", format: "uuid", description: "Move ID" },
          type: {
            type: "string",
            enum: ["hotel", "serviced_apartment", "airbnb", "apartment", "condo", "single_family_home"],
            description: "Housing type",
          },
          isTemporary: { type: "boolean", description: "Filter by temporary vs permanent" },
        },
      },
    },
    {
      name: "create_housing_option",
      description: "Add a new housing option",
      parameters: {
        type: "object",
        properties: {
          moveId: { type: "string", format: "uuid", description: "Move ID" },
          type: {
            type: "string",
            enum: ["hotel", "serviced_apartment", "airbnb", "apartment", "condo", "single_family_home"],
            description: "Housing type",
          },
          isTemporary: { type: "boolean", description: "Whether this is temporary housing" },
          address: { type: "string", description: "Street address" },
          city: { type: "string", description: "City" },
          state: { type: "string", description: "State" },
          price: { type: "string", description: "Price" },
          commuteToOffice: { type: "number", description: "Commute time in minutes" },
        },
        required: ["moveId", "type", "isTemporary", "address", "city", "price"],
      },
    },
    {
      name: "select_housing",
      description: "Select a housing option",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Housing option ID" },
        },
        required: ["id"],
      },
    },
  ],
  services: [
    {
      name: "list_services",
      description: "List all services for a move",
      parameters: {
        type: "object",
        properties: {
          moveId: { type: "string", format: "uuid", description: "Move ID" },
          type: {
            type: "string",
            enum: [
              "temporary_housing",
              "permanent_housing",
              "hhg",
              "car_shipment",
              "flight",
              "dsp_orientation",
              "other",
            ],
            description: "Service type",
          },
        },
      },
    },
    {
      name: "create_hhg_quote",
      description: "Create an HHG (Household Goods) quote",
      parameters: {
        type: "object",
        properties: {
          moveId: { type: "string", format: "uuid", description: "Move ID" },
          originAddress: { type: "string", description: "Origin address" },
          destinationAddress: { type: "string", description: "Destination address" },
          estimatedWeight: { type: "number", description: "Estimated weight in pounds" },
        },
        required: ["moveId", "originAddress", "destinationAddress"],
      },
    },
  ],
  financial: [
    {
      name: "list_invoices",
      description: "List invoices for a move",
      parameters: {
        type: "object",
        properties: {
          moveId: { type: "string", format: "uuid", description: "Move ID" },
          status: {
            type: "string",
            enum: ["draft", "sent", "paid", "overdue"],
            description: "Invoice status",
          },
        },
      },
    },
    {
      name: "calculate_tax_grossup",
      description: "Calculate tax and gross-up for a move",
      parameters: {
        type: "object",
        properties: {
          moveId: { type: "string", format: "uuid", description: "Move ID" },
          amount: { type: "number", description: "Base amount" },
        },
        required: ["moveId", "amount"],
      },
    },
  ],
  operations: [
    {
      name: "list_policy_exceptions",
      description: "List policy exceptions",
      parameters: {
        type: "object",
        properties: {
          moveId: { type: "string", format: "uuid", description: "Move ID" },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected"],
            description: "Exception status",
          },
        },
      },
    },
    {
      name: "list_check_ins",
      description: "List check-ins for a move",
      parameters: {
        type: "object",
        properties: {
          moveId: { type: "string", format: "uuid", description: "Move ID" },
          type: {
            type: "string",
            enum: ["t_minus_48", "day_of_move", "t_plus_48"],
            description: "Check-in type",
          },
        },
      },
    },
  ],
};

// Convert date strings to Date objects
function convertDates<T extends Record<string, string | number | boolean | null | undefined>>(args: T): T {
  const converted = { ...args };
  const dateFields = ["moveDate", "departureDate", "returnDate", "desiredShipDate", "scheduledAt", "availabilityStartDate", "availabilityEndDate"] as const;
  
  for (const field of dateFields) {
    if (converted[field] && typeof converted[field] === "string") {
      (converted as Record<string, string | number | boolean | null | undefined | Date>)[field] = new Date(converted[field] as string);
    }
  }
  
  return converted;
}

// Tool call result type - any JSON-serializable value
type ToolCallResult = 
  | string 
  | number 
  | boolean 
  | null 
  | Date 
  | Record<string, string | number | boolean | null | Date | Record<string, string | number | boolean | null | Date> | Array<string | number | boolean | null | Date | Record<string, string | number | boolean | null | Date>>> 
  | Array<string | number | boolean | null | Date | Record<string, string | number | boolean | null | Date>>;

// Execute a tool call via tRPC
async function executeToolCall(
  toolName: string,
  args: Record<string, string | number | boolean | null | undefined>,
  workflow?: string
): Promise<string> {
  try {
    // Convert date strings to Date objects
    const processedArgs = convertDates(args);
    // Map tool names to tRPC endpoints (matching actual router structure)
    // Using type assertions since OpenAI provides args as JSON-parsed values
    // and we trust OpenAI's validation matches our schemas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolMap: Record<string, (args: Record<string, string | number | boolean | null | undefined | Date>) => Promise<any>> = {
      list_moves: (a) => trpc.moves.list.query(a as Parameters<typeof trpc.moves.list.query>[0]),
      get_move: (a) => trpc.moves.getById.query(a as Parameters<typeof trpc.moves.getById.query>[0]),
      create_move: (a) => trpc.moves.create.mutate(a as Parameters<typeof trpc.moves.create.mutate>[0]),
      update_move_status: (a) => trpc.moves.updateStatus.mutate(a as Parameters<typeof trpc.moves.updateStatus.mutate>[0]),
      search_housing: (a) => trpc.housing.search.query(a as unknown as Parameters<typeof trpc.housing.search.query>[0]),
      list_housing_options: (a) => trpc.housing.list.query(a as unknown as Parameters<typeof trpc.housing.list.query>[0]),
      create_housing_option: (a) => trpc.housing.create.mutate(a as unknown as Parameters<typeof trpc.housing.create.mutate>[0]),
      select_housing: (a) => trpc.housing.select.mutate(a as unknown as Parameters<typeof trpc.housing.select.mutate>[0]),
      list_services: (a) => trpc.services.list.query(a as unknown as Parameters<typeof trpc.services.list.query>[0]),
      create_hhg_quote: (a) => trpc.services.hhgQuotes.create.mutate(a as unknown as Parameters<typeof trpc.services.hhgQuotes.create.mutate>[0]),
      create_car_shipment: (a) => trpc.services.carShipments.create.mutate(a as unknown as Parameters<typeof trpc.services.carShipments.create.mutate>[0]),
      create_flight: (a) => trpc.services.flights.create.mutate(a as unknown as Parameters<typeof trpc.services.flights.create.mutate>[0]),
      book_flight: (a) => trpc.services.flights.book.mutate(a as unknown as Parameters<typeof trpc.services.flights.book.mutate>[0]),
      list_invoices: (a) => trpc.financial.invoices.list.query(a as unknown as Parameters<typeof trpc.financial.invoices.list.query>[0]),
      create_invoice: (a) => trpc.financial.invoices.create.mutate(a as unknown as Parameters<typeof trpc.financial.invoices.create.mutate>[0]),
      calculate_tax_grossup: (a) => trpc.financial.taxGrossUps.calculate.mutate(a as unknown as Parameters<typeof trpc.financial.taxGrossUps.calculate.mutate>[0]),
      list_policy_exceptions: (a) => trpc.operations.policyExceptions.list.query(a as unknown as Parameters<typeof trpc.operations.policyExceptions.list.query>[0]),
      create_policy_exception: (a) => trpc.operations.policyExceptions.create.mutate(a as unknown as Parameters<typeof trpc.operations.policyExceptions.create.mutate>[0]),
      list_check_ins: (a) => trpc.operations.checkIns.list.query(a as unknown as Parameters<typeof trpc.operations.checkIns.list.query>[0]),
      create_check_in: (a) => trpc.operations.checkIns.create.mutate(a as unknown as Parameters<typeof trpc.operations.checkIns.create.mutate>[0]),
      list_service_breaks: (a) => trpc.operations.serviceBreaks.list.query(a as unknown as Parameters<typeof trpc.operations.serviceBreaks.list.query>[0]),
      create_service_break: (a) => trpc.operations.serviceBreaks.report.mutate(a as unknown as Parameters<typeof trpc.operations.serviceBreaks.report.mutate>[0]),
    };

    const handler = toolMap[toolName];
    if (!handler) {
      return `Error: Tool "${toolName}" not found. Available tools: ${Object.keys(toolMap).join(", ")}`;
    }

    const result = await handler(processedArgs);
    return JSON.stringify(result, null, 2);
  } catch (error) {
    return `Error executing tool "${toolName}": ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Tool call type
type ToolCall = {
  name: string;
  arguments: Record<string, string | number | boolean | null | undefined>;
  result: string;
};

export async function getAIResponse(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  workflow?: "moves" | "housing" | "services" | "financial" | "operations"
): Promise<{ content: string; toolCalls?: ToolCall[] }> {
  const tools = workflow ? workflowTools[workflow] || [] : Object.values(workflowTools).flat();

  const openaiTools = tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    tools: openaiTools.length > 0 ? openaiTools : undefined,
    tool_choice: openaiTools.length > 0 ? "auto" : undefined,
  });

  const message = response.choices[0]?.message;
  if (!message) {
    return { content: "No response from AI" };
  }

  // Handle tool calls
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCalls = [];
    const toolResults: Array<{ role: "tool"; content: string; tool_call_id: string }> = [];

    for (const toolCall of message.tool_calls) {
      if (toolCall.type === "function") {
        const args = JSON.parse(toolCall.function.arguments || "{}") as Record<string, string | number | boolean | null | undefined>;
        const result = await executeToolCall(toolCall.function.name, args, workflow);

        toolCalls.push({
          name: toolCall.function.name,
          arguments: args,
          result,
        });

        toolResults.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
        });
      }
    }

    // Get final response after tool calls
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...messages,
        { role: "assistant", content: message.content || "", tool_calls: message.tool_calls },
        ...toolResults,
      ],
      tools: openaiTools.length > 0 ? openaiTools : undefined,
    });

    return {
      content: finalResponse.choices[0]?.message?.content || "Tool calls executed successfully",
      toolCalls,
    };
  }

  return {
    content: message.content || "No response",
  };
}

