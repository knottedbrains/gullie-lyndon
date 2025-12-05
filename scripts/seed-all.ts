import "dotenv/config";
import { db } from "../src/server/db";
import {
  employees,
  employers,
  moves,
  conversations,
  conversationParticipants,
  messages,
} from "../src/server/db/schema";
import { eq } from "drizzle-orm";

async function seedAll() {
  console.log("🌱 Seeding database with test data...\n");

  try {
    // Step 1: Seed Employers
    console.log("🏢 Seeding employers...");
    const employerData = [
      {
        name: "Tech Corp Inc",
        email: "hr@techcorp.com",
      },
      {
        name: "Finance Solutions LLC",
        email: "relocations@financesolutions.com",
      },
    ];

    const createdEmployers: any[] = [];
    for (const data of employerData) {
      const existing = await db
        .select()
        .from(employers)
        .where(eq(employers.email, data.email))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  ✓ Employer ${data.name} already exists`);
        createdEmployers.push(existing[0]);
      } else {
        const [employer] = await db
          .insert(employers)
          .values(data)
          .returning();
        console.log(`  ✓ Created employer: ${data.name}`);
        createdEmployers.push(employer);
      }
    }

    // Step 2: Seed Employees
    console.log("\n👤 Seeding employees...");
    const employeeData = [
      {
        fullName: "John Smith",
        email: "john.smith@example.com",
        phone: "+1-555-0101",
        officeLocation: "San Francisco",
      },
      {
        fullName: "Jane Doe",
        email: "jane.doe@example.com",
        phone: "+1-555-0102",
        officeLocation: "New York",
      },
      {
        fullName: "Bob Johnson",
        email: "bob.johnson@example.com",
        phone: "+1-555-0103",
        officeLocation: "Chicago",
      },
    ];

    const createdEmployees: any[] = [];
    for (const data of employeeData) {
      const existing = await db
        .select()
        .from(employees)
        .where(eq(employees.email, data.email))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  ✓ Employee ${data.fullName} already exists`);
        createdEmployees.push(existing[0]);
      } else {
        const [employee] = await db
          .insert(employees)
          .values(data)
          .returning();
        console.log(`  ✓ Created employee: ${data.fullName}`);
        createdEmployees.push(employee);
      }
    }

    // Step 3: Seed Moves
    console.log("\n🚚 Seeding moves...");
    const moveData = [
      {
        employeeId: createdEmployees[0].id,
        employerId: createdEmployers[0].id,
        originCity: "San Francisco",
        destinationCity: "New York",
        officeLocation: "New York Office",
        programType: "Executive Relocation",
        benefitAmount: "50000",
        moveDate: new Date("2025-03-15"),
      },
      {
        employeeId: createdEmployees[1].id,
        employerId: createdEmployers[1].id,
        originCity: "New York",
        destinationCity: "Austin",
        officeLocation: "Austin Office",
        programType: "Standard Relocation",
        benefitAmount: "30000",
        moveDate: new Date("2025-04-01"),
      },
      {
        employeeId: createdEmployees[2].id,
        employerId: createdEmployers[0].id,
        originCity: "Chicago",
        destinationCity: "Seattle",
        officeLocation: "Seattle Office",
        programType: "Executive Relocation",
        benefitAmount: "45000",
        moveDate: new Date("2025-05-10"),
      },
    ];

    const createdMoves: any[] = [];
    for (const data of moveData) {
      const [move] = await db
        .insert(moves)
        .values(data)
        .returning();
      console.log(`  ✓ Created move: ${data.originCity} → ${data.destinationCity}`);
      createdMoves.push(move);
    }

    // Step 4: Seed Conversations
    console.log("\n💬 Seeding conversations...");
    const conversationData = [
      {
        moveId: createdMoves[0].id,
        title: "Housing Search Discussion",
        type: "housing" as const,
        status: "active" as const,
        visibility: "shared" as const,
      },
      {
        moveId: createdMoves[0].id,
        title: "Moving Services",
        type: "moving" as const,
        status: "active" as const,
        visibility: "shared" as const,
      },
      {
        moveId: createdMoves[1].id,
        title: "General Relocation Questions",
        type: "general" as const,
        status: "active" as const,
        visibility: "shared" as const,
      },
    ];

    const createdConversations: any[] = [];
    for (const data of conversationData) {
      const [conversation] = await db
        .insert(conversations)
        .values(data)
        .returning();
      console.log(`  ✓ Created conversation: ${data.title}`);
      createdConversations.push(conversation);

      // Add AI participant
      await db.insert(conversationParticipants).values({
        conversationId: conversation.id,
        userId: null,
        participantType: "ai",
        role: "participant",
      });
    }

    // Step 5: Seed Sample Messages
    console.log("\n📨 Seeding sample messages...");
    const messageData = [
      {
        conversationId: createdConversations[0].id,
        authorType: "user" as const,
        content: "Hi, I need help finding housing in New York. What are my options?",
      },
      {
        conversationId: createdConversations[0].id,
        authorType: "ai" as const,
        content: "I'd be happy to help you find housing in New York! I can assist with searching for apartments, understanding your budget, and coordinating with local real estate agents. What's your preferred area and budget range?",
      },
    ];

    for (const data of messageData) {
      await db.insert(messages).values(data);
    }
    console.log(`  ✓ Created ${messageData.length} sample messages`);

    // Summary
    console.log("\n✨ Database seeding complete!\n");
    console.log("📊 Summary:");
    console.log(`  ✅ Employers: ${createdEmployers.length}`);
    console.log(`  ✅ Employees: ${createdEmployees.length}`);
    console.log(`  ✅ Moves: ${createdMoves.length}`);
    console.log(`  ✅ Conversations: ${createdConversations.length}`);
    console.log(`  ✅ Messages: ${messageData.length}`);
    console.log("\n🎉 You can now access the application with test data!");
    console.log(`\nFirst move ID: ${createdMoves[0].id}`);
    console.log(`First conversation ID: ${createdConversations[0].id}`);

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedAll()
  .then(() => {
    console.log("\nExiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
