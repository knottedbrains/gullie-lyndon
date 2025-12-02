import { ElementType } from "react";
import { MoveDetailsWidget } from "@/components/chat/widgets/move-details";
import { MoveListWidget } from "@/components/chat/widgets/move-list";
import { HousingListWidget } from "@/components/chat/widgets/housing-list";
import { InvoiceListWidget } from "@/components/chat/widgets/invoice-list";
import { ServiceListWidget } from "@/components/chat/widgets/service-list";

export interface ToolResult {
  move?: Record<string, unknown>;
  employee?: Record<string, unknown>;
  employer?: Record<string, unknown>;
  invoices?: unknown[];
  services?: unknown[];
  options?: unknown[];
  items?: unknown[];
  // Allow flexible properties for spread
  [key: string]: unknown;
}

export const WIDGET_REGISTRY: Record<string, ElementType> = {
  "get_move": MoveDetailsWidget,
  "create_move": MoveDetailsWidget,
  "create_test_move": MoveDetailsWidget,
  "list_moves": MoveListWidget,
  "list_housing_options": HousingListWidget,
  "search_housing": HousingListWidget,
  "list_invoices": InvoiceListWidget,
  "list_services": ServiceListWidget,
};

export const parseToolResult = (result: string | undefined): ToolResult | null => {
  if (!result) return null;
  try {
    const parsed = (typeof result === "string" ? JSON.parse(result) : result) as ToolResult;
    if (parsed.move) {
      return {
        ...parsed.move,
        employee: parsed.employee,
        employer: parsed.employer,
        move: undefined
      };
    }
    if (Array.isArray(parsed)) {
      // Heuristic: check first item to determine type
      if (parsed.length > 0) {
        const firstItem = parsed[0] as Record<string, unknown>;
        if (firstItem.invoiceNumber) return { invoices: parsed };
        if (firstItem.type && firstItem.status) return { services: parsed };
        if (firstItem.address && firstItem.price) return { options: parsed };
      }
      // If empty array or unknown type, generic fallback (or could be specific based on tool name)
      return { items: parsed };
    }
    return parsed;
  } catch (e) {
    return null;
  }
};

