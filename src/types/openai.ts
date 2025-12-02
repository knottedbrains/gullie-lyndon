export type OpenAIFunctionParameters = {
  type: "object";
  properties: Record<string, {
    type?: string;
    enum?: readonly string[];
    format?: string;
    description: string;
  }>;
  required?: string[];
};

