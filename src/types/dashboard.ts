export type UserRole = "employee" | "company" | "vendor" | "admin";

export type MoveStatus =
  | "initiated"
  | "intake_in_progress"
  | "housing_search"
  | "services_booked"
  | "in_transit"
  | "completed"
  | "cancelled";

export type ServiceStatus =
  | "pending"
  | "quoted"
  | "approved"
  | "booked"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "exception";

export interface PolicyStatus {
  hasFormalPolicy: boolean;
  maxTemporaryHousingBudget?: number;
  maxHousingBudget?: number;
  overallRelocationBudget?: number;
  coveredServices: string[];
  requiresApprovalForAll: boolean;
}

export interface RelocationProgress {
  moveId: string;
  status: MoveStatus;
  milestones: {
    name: string;
    completed: boolean;
    completedAt?: Date;
  }[];
  completionPercentage: number;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  officeLocation: string;
  moveId?: string;
  moveStatus?: MoveStatus;
}

export interface Service {
  id: string;
  moveId: string;
  type: string;
  status: ServiceStatus;
  vendorId?: string;
  vendorName?: string;
  createdAt: Date;
}

import { LucideIcon } from "lucide-react";

export interface DashboardStats {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export interface DashboardFilters {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

