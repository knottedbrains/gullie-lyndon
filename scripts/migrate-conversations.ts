/**
 * Data Migration: chatSessions → conversations
 *
 * This script migrates existing chat data to the new conversation structure:
 * - chatSessions → conversations
 * - chatMessages → messages
 * - Creates AI participants for each conversation
 * - Attempts to link employee participants based on move data
 */

import "dotenv/config";
import { db } from "../src/server/db";
import {
  chatSessions,
  chatMessages,
  conversations,
  conversationParticipants,
  messages,
  moves,
  users,
  employees
} from "../src/server/db/schema";
import { eq, sql } from "drizzle-orm";

async function migrateConversations() {
  console.log("🔄 Starting conversation migration...\n");

  try {
    // Step 1: Check existing data
    console.log("📊 Checking existing data...");
    const oldSessions = await db.select().from(chatSessions);
    const oldMessages = await db.select().from(chatMessages);

    console.log(`  Found ${oldSessions.length} chat sessions`);
    console.log(`  Found ${oldMessages.length} chat messages`);

    const sessionsWithMove = oldSessions.filter(s => s.moveId);
    const sessionsWithoutMove = oldSessions.filter(s => !s.moveId);

    console.log(`  ${sessionsWithMove.length} sessions have moveId`);
    console.log(`  ${sessionsWithoutMove.length} sessions WITHOUT moveId (will be skipped)\n`);

    if (sessionsWithoutMove.length > 0) {
      console.log("⚠️  Warning: The following sessions will NOT be migrated (no moveId):");
      sessionsWithoutMove.forEach(s => {
        console.log(`     - ${s.id}: "${s.title}" (created: ${s.createdAt})`);
      });
      console.log();
    }

    // Step 2: Migrate chatSessions → conversations
    console.log("📝 Migrating chat sessions to conversations...");
    let migratedConversations = 0;

    for (const session of sessionsWithMove) {
      try {
        await db.insert(conversations).values({
          id: session.id,
          moveId: session.moveId!,
          title: session.title,
          type: "general", // Default type
          status: "active", // Default status
          createdBy: null, // We don't track this in old schema
          agentMailInboxId: session.agentMailInboxId,
          agentMailEmailAddress: session.agentMailEmailAddress,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        });
        migratedConversations++;
      } catch (error: any) {
        if (error.code === '23505') { // Unique violation
          console.log(`  ⏭️  Skipping ${session.id} (already exists)`);
        } else {
          console.error(`  ❌ Error migrating session ${session.id}:`, error.message);
        }
      }
    }

    console.log(`  ✅ Migrated ${migratedConversations} conversations\n`);

    // Step 3: Migrate chatMessages → messages
    console.log("💬 Migrating chat messages...");
    let migratedMessages = 0;
    const conversationIds = new Set(sessionsWithMove.map(s => s.id));
    const messagesToMigrate = oldMessages.filter(m => conversationIds.has(m.sessionId));

    console.log(`  ${messagesToMigrate.length} messages to migrate`);

    for (const message of messagesToMigrate) {
      try {
        // Map old role to new authorType
        let authorType: "user" | "ai" | "system";
        if (message.role === "assistant") {
          authorType = "ai";
        } else if (message.role === "system") {
          authorType = "system";
        } else {
          authorType = "user";
        }

        await db.insert(messages).values({
          id: message.id,
          conversationId: message.sessionId,
          authorId: null, // We don't track this in old schema
          authorType,
          content: message.content,
          toolCalls: message.toolCalls as any,
          reasoning: message.reasoning,
          model: message.model,
          metadata: message.metadata as any,
          createdAt: message.createdAt,
        });
        migratedMessages++;
      } catch (error: any) {
        if (error.code === '23505') { // Unique violation
          // Message already exists, skip
        } else {
          console.error(`  ❌ Error migrating message ${message.id}:`, error.message);
        }
      }
    }

    console.log(`  ✅ Migrated ${migratedMessages} messages\n`);

    // Step 4: Create AI participants for each conversation
    console.log("🤖 Creating AI participants...");
    const allConversations = await db.select().from(conversations);
    let aiParticipantsCreated = 0;

    for (const conversation of allConversations) {
      try {
        await db.insert(conversationParticipants).values({
          conversationId: conversation.id,
          userId: null, // AI doesn't have a userId
          participantType: "ai",
          role: "participant",
        });
        aiParticipantsCreated++;
      } catch (error: any) {
        if (error.code === '23505') {
          // Participant already exists
        } else {
          console.error(`  ❌ Error creating AI participant for ${conversation.id}:`, error.message);
        }
      }
    }

    console.log(`  ✅ Created ${aiParticipantsCreated} AI participants\n`);

    // Step 5: Try to link employee participants based on moves
    console.log("👥 Linking employee participants...");
    let employeesLinked = 0;

    for (const conversation of allConversations) {
      try {
        // Find the move and employee for this conversation
        const [move] = await db
          .select()
          .from(moves)
          .where(eq(moves.id, conversation.moveId))
          .limit(1);

        if (!move) continue;

        // Find the employee
        const [employee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, move.employeeId))
          .limit(1);

        if (!employee || !employee.email) continue;

        // Find the user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, employee.email))
          .limit(1);

        if (!user) continue;

        // Create employee participant
        await db.insert(conversationParticipants).values({
          conversationId: conversation.id,
          userId: user.id,
          participantType: "employee",
          role: "owner",
        });
        employeesLinked++;
      } catch (error: any) {
        if (error.code === '23505') {
          // Participant already exists
        } else {
          // Silently skip if can't link
        }
      }
    }

    console.log(`  ✅ Linked ${employeesLinked} employee participants\n`);

    // Step 6: Summary
    console.log("📊 Migration Summary:");
    console.log(`  ✅ Conversations: ${migratedConversations}`);
    console.log(`  ✅ Messages: ${migratedMessages}`);
    console.log(`  ✅ AI Participants: ${aiParticipantsCreated}`);
    console.log(`  ✅ Employee Participants: ${employeesLinked}`);
    console.log(`  ⚠️  Skipped sessions (no moveId): ${sessionsWithoutMove.length}`);

    // Validation
    console.log("\n🔍 Validation:");
    const finalConversations = await db.select().from(conversations);
    const finalMessages = await db.select().from(messages);
    const finalParticipants = await db.select().from(conversationParticipants);

    console.log(`  Total conversations: ${finalConversations.length}`);
    console.log(`  Total messages: ${finalMessages.length}`);
    console.log(`  Total participants: ${finalParticipants.length}`);

    // Check for conversations without participants
    const conversationsWithoutParticipants = await db
      .select()
      .from(conversations)
      .leftJoin(
        conversationParticipants,
        eq(conversations.id, conversationParticipants.conversationId)
      )
      .where(sql`${conversationParticipants.id} IS NULL`);

    if (conversationsWithoutParticipants.length > 0) {
      console.log(`  ⚠️  ${conversationsWithoutParticipants.length} conversations have no participants!`);
    }

    console.log("\n✨ Migration complete!");
    console.log("\n⚠️  Note: Old tables (chat_sessions, chat_messages) are still present.");
    console.log("   Verify the migration in your app before dropping them.");
    console.log("   To drop old tables, run: scripts/drop-old-chat-tables.ts\n");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateConversations()
  .then(() => {
    console.log("Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
