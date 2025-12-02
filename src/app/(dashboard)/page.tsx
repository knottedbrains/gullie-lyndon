"use client";

import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import { CompanyDashboard } from "@/components/dashboard/company-dashboard";
import { VendorDashboard } from "@/components/dashboard/vendor-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { trpc } from "@/utils/trpc";

export default function DashboardPage() {
  // Get current user - for now using mock, will be replaced with real auth
  const { data: user } = trpc.users.getCurrentUser.useQuery();
  
  // For development, default to admin if no user
  const role = user?.role || "admin";

  // Render role-specific dashboard
  switch (role) {
    case "employee":
      return <EmployeeDashboard employeeId={user?.id} />;
    case "company":
      return <CompanyDashboard employerId={user?.employerId || undefined} />;
    case "vendor":
      return <VendorDashboard vendorId={user?.id} />;
    case "admin":
    default:
      return <AdminDashboard />;
  }
}
