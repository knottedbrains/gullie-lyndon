import { z } from "zod";
import { trpc } from "@/mcp/trpc-client";
import type { AppRouter } from "../routers/_app";

// Type for server-side caller
type ServerCaller = ReturnType<AppRouter["createCaller"]>;
// Type for HTTP client
type HTTPClient = typeof trpc;
// Union type that accepts both
type TRPCClient = ServerCaller | HTTPClient;

export type ToolContext = {
  trpc: TRPCClient;
  sessionId?: string;
};

// Helper to call tRPC procedures that works with both server-side callers and HTTP clients
export async function callTRPCProcedure(
  procedure: any,
  args: any,
  isMutation: boolean = true
): Promise<any> {
  if (!procedure) {
    throw new Error('tRPC procedure is undefined or null');
  }
  
  // For HTTP clients, procedures have .mutate() or .query() methods
  if (procedure && typeof procedure === 'object') {
    if (isMutation && typeof procedure.mutate === 'function') {
      return await procedure.mutate(args);
    }
    if (!isMutation && typeof procedure.query === 'function') {
      return await procedure.query(args);
    }
  }
  
  // For server-side callers, the procedure is a function that can be called directly
  if (typeof procedure === 'function') {
    return await procedure(args);
  }
  
  // If we get here, the procedure format is unexpected
  throw new Error(
    `Invalid tRPC procedure: expected a function or an object with ${isMutation ? 'mutate' : 'query'} method, got ${typeof procedure}`
  );
}

export interface ToolDefinition<T extends z.ZodType = z.ZodType<any, any>> {
  name: string;
  description: string;
  schema: T;
  handler: (args: z.infer<T>, ctx: ToolContext) => Promise<object>;
}

export class ToolBuilder<TSchema extends z.ZodType = z.ZodType<any, any>> {
  private _name: string;
  private _description?: string;
  private _schema?: TSchema;

  constructor(name: string) {
    this._name = name;
  }

  describe(description: string): this {
    this._description = description;
    return this;
  }

  input<T extends z.ZodType>(schema: T): ToolBuilder<T> {
    const builder = new ToolBuilder<T>(this._name);
    builder._description = this._description;
    builder._schema = schema;
    return builder;
  }

  handler(
    fn: (args: z.infer<TSchema>, ctx: ToolContext) => Promise<object>
  ): ToolDefinition<TSchema> {
    if (!this._description) {
      throw new Error(`Tool "${this._name}" is missing a description.`);
    }
    if (!this._schema) {
      throw new Error(`Tool "${this._name}" is missing an input schema.`);
    }

    return {
      name: this._name,
      description: this._description,
      schema: this._schema,
      handler: fn,
    };
  }
}

export const createTool = (name: string) => new ToolBuilder(name);

