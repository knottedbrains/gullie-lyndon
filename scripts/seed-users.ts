import "dotenv/config";
import { auth } from "../better-auth";
import { db } from "../src/server/db";
import { users } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

async function seedUsers() {
  console.log("🌱 Seeding test users...");

  const testUsers = [
    {
      email: "admin@gullie.com",
      name: "Admin User",
      role: "admin" as const,
      employerId: null,
    },
    {
      email: "employee@gullie.com",
      name: "Employee User",
      role: "employee" as const,
      employerId: null,
    },
    {
      email: "employer@gullie.com",
      name: "Employer User",
      role: "company" as const,
      employerId: null,
    },
    {
      email: "vendor@gullie.com",
      name: "Vendor User",
      role: "vendor" as const,
      employerId: null,
    },
  ];

  const password = "password"; // Default password for all test accounts

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`✓ User ${userData.email} already exists`);
        continue;
      }

      // Create user using Better Auth API
      await auth.api.signUpEmail({
        body: {
          email: userData.email,
          name: userData.name,
          password: password,
          role: userData.role,
          employerId: userData.employerId,
        },
      });

      console.log(`✓ Created user ${userData.email} with password: ${password}`);
    } catch (error) {
      console.error(`✗ Error creating user ${userData.email}:`, error);
    }
  }

  console.log("\n✨ Seeding complete!");
  console.log("\nTest accounts:");
  console.log("  Email: admin@gullie.com | Password: password");
  console.log("  Email: employee@gullie.com | Password: password");
  console.log("  Email: employer@gullie.com | Password: password");
  console.log("  Email: vendor@gullie.com | Password: password");
}

seedUsers()
  .catch((error) => {
    console.error("Fatal error during seeding:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
