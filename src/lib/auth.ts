// Simple auth system - can be replaced with NextAuth later
// For now, we'll use a debug role selector in development

export type UserRole = "employee" | "company" | "vendor" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employerId?: string | null;
}

// Server-side: Get current user from cookies or env vars
export async function getCurrentUser(cookies?: { get: (name: string) => { value: string } | undefined }): Promise<User | null> {
  // Check for debug role in cookies (set by client-side role selector)
  let role: UserRole = "admin";
  
  if (cookies) {
    const debugRoleCookie = cookies.get("debug_user_role");
    if (debugRoleCookie?.value && ["admin", "company", "vendor", "employee"].includes(debugRoleCookie.value)) {
      role = debugRoleCookie.value as UserRole;
    }
  }
  
  // Fallback: check environment variables
  if (process.env.MOCK_USER_ROLE && ["admin", "company", "vendor", "employee"].includes(process.env.MOCK_USER_ROLE)) {
    role = process.env.MOCK_USER_ROLE as UserRole;
  }
  
  // Return mock user with selected role
  // Use a valid UUID format for debug employerId (all zeros with a prefix for identification)
  const debugEmployerId = role === "company" ? "00000000-0000-0000-0000-000000000001" : null;
  
  return {
    id: `debug-user-${role}`,
    email: `${role}@gullie.com`,
    name: `Debug ${role.charAt(0).toUpperCase() + role.slice(1)} User`,
    role: role,
    employerId: debugEmployerId,
  };
}

export function requireAuth(user: User | null): User {
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export function requireRole(user: User | null, allowedRoles: UserRole[]): User {
  const authenticatedUser = requireAuth(user);
  if (!allowedRoles.includes(authenticatedUser.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}`);
  }
  return authenticatedUser;
}

