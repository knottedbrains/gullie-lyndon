import { auth } from "../../better-auth";
import { headers } from "next/headers";

export type UserRole = "employee" | "company" | "vendor" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employerId?: string | null;
}

// Server-side: Get current user from Better Auth session
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return null;
    }

    // Better Auth user includes our custom fields (role, employerId)
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user.role as UserRole) || "employee",
      employerId: session.user.employerId || null,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
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

