import type { UserRole, DashboardFilters, MoveStatus, ServiceStatus } from "@/types/dashboard";

/**
 * Filter data based on user role
 */
export function filterByRole<T extends { employerId?: string; employeeId?: string; vendorId?: string }>(
  data: T[],
  role: UserRole,
  userEmployerId?: string | null,
  userEmployeeId?: string | null,
  userVendorId?: string | null
): T[] {
  switch (role) {
    case "company":
      return data.filter((item) => item.employerId === userEmployerId);
    case "employee":
      return data.filter((item) => item.employeeId === userEmployeeId);
    case "vendor":
      return data.filter((item) => item.vendorId === userVendorId);
    case "admin":
    default:
      return data;
  }
}

/**
 * Calculate progress percentage for a move status
 */
export function calculateMoveProgress(status: MoveStatus): number {
  const statusOrder: MoveStatus[] = [
    "initiated",
    "intake_in_progress",
    "housing_search",
    "services_booked",
    "in_transit",
    "completed",
    "cancelled",
  ];
  
  if (status === "cancelled") return 0;
  const index = statusOrder.indexOf(status);
  return index >= 0 ? ((index + 1) / (statusOrder.length - 1)) * 100 : 0;
}

/**
 * Format status for display
 */
export function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get status variant for badges
 */
export function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "default";
  if (normalized === "cancelled") return "destructive";
  if (normalized === "pending" || normalized === "quoted") return "outline";
  return "secondary";
}

/**
 * Apply filters to data
 */
export function applyFilters<T>(
  data: T[],
  filters: DashboardFilters,
  getSearchableText: (item: T) => string
): T[] {
  let filtered = data;

  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter((item) =>
      getSearchableText(item).toLowerCase().includes(query)
    );
  }

  if (filters.status) {
    filtered = filtered.filter((item: any) => item.status === filters.status);
  }

  if (filters.dateFrom) {
    filtered = filtered.filter((item: any) => {
      const itemDate = item.createdAt ? new Date(item.createdAt) : null;
      return itemDate && itemDate >= filters.dateFrom!;
    });
  }

  if (filters.dateTo) {
    filtered = filtered.filter((item: any) => {
      const itemDate = item.createdAt ? new Date(item.createdAt) : null;
      return itemDate && itemDate <= filters.dateTo!;
    });
  }

  return filtered;
}

/**
 * Calculate monthly spend from invoices
 */
export function calculateMonthlySpend(
  invoices: Array<{ total?: string | number; createdAt?: Date | string | null }>,
  month?: Date
): number {
  const targetMonth = month || new Date();
  const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

  const monthInvoices = invoices.filter((inv) => {
    if (!inv.createdAt) return false;
    const invDate = new Date(inv.createdAt);
    return invDate >= startOfMonth && invDate <= endOfMonth;
  });

  return monthInvoices.reduce((sum, inv) => {
    return sum + (parseFloat(inv.total?.toString() || "0") || 0);
  }, 0);
}

/**
 * Get role-specific navigation items
 */
export function getNavigationForRole(role: UserRole) {
  // This is now handled in the Sidebar component, but kept here for reference
  // and potential reuse in other components
  switch (role) {
    case "employee":
      return ["Overview"];
    case "company":
      return ["Overview", "Moves"];
    case "vendor":
      return ["Overview", "Services"];
    case "admin":
    default:
      return ["Overview", "Moves", "Housing", "Services", "Financial", "Settings"];
  }
}
