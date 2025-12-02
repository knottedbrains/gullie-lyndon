import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { chatMessages, chatSessions } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { emailService } from "@/server/services/email-service";
import { getAIResponse } from "@/server/services/openai-service";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/trpc";

// AgentMail webhook payload type
interface WebhookPayload {
  type: string;
  data: {
    message_id: string;
    inbox_id: string;
    // Add other fields as needed
  };
  created_at: string;
}

export async function POST(req: NextRequest) {
  try {
    // Verify secret if needed (optional for now, but good practice)
    // const signature = req.headers.get("svix-signature");
    // ... verification logic ...

    const payload = (await req.json()) as WebhookPayload;
    console.log("Received webhook:", JSON.stringify(payload, null, 2));

    if (payload.type === "message.received" || payload.type === "message.sent" || payload.type === "message.delivered" || payload.type === "message.bounced" || payload.type === "message.complained" || payload.type === "message.rejected") {
      const { message_id, inbox_id } = payload.data;

      // 1. Find the session associated with this inbox
      const session = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.agentMailInboxId, inbox_id),
      });

      if (!session) {
        console.warn(`No session found for inbox: ${inbox_id}`);
        return NextResponse.json({ status: "ignored", reason: "no_session" });
      }

      // Handle Delivery Events
      if (["message.delivered", "message.bounced", "message.complained", "message.rejected"].includes(payload.type)) {
        // Find the original message by emailId
        const existing = await db
          .select()
          .from(chatMessages)
          .where(
            sql`${chatMessages.sessionId} = ${session.id} AND ${chatMessages.metadata}->>'emailId' = ${message_id}`
          )
          .limit(1);

        if (existing.length > 0) {
           // Update status or append a system note? 
           // For now, let's just log it as a system message
           await db.insert(chatMessages).values({
             sessionId: session.id,
             role: "system",
             content: `Email status update: ${payload.type.replace("message.", "")}`,
             createdAt: new Date(),
           });
           return NextResponse.json({ status: "ok", reason: "status_updated" });
        }
      }

      // For sent/received, we want to store the message
      if (payload.type === "message.received" || payload.type === "message.sent") {
          // 2. Check if message already exists
          const existing = await db
            .select()
            .from(chatMessages)
            .where(
              sql`${chatMessages.sessionId} = ${session.id} AND ${chatMessages.metadata}->>'emailId' = ${message_id}`
            )
            .limit(1);

          if (existing.length > 0) {
            console.log(`Message ${message_id} already exists.`);
            return NextResponse.json({ status: "ok", reason: "already_exists" });
          }

          // 3. Fetch full message details
          let fullMsg;
          try {
            fullMsg = await emailService.getMessage(inbox_id, message_id);
          } catch (e) {
            console.error(`Failed to fetch message ${message_id}:`, e);
            return NextResponse.json({ status: "error", reason: "fetch_failed" }, { status: 500 });
          }

          // 4. Insert into chat
          const role = payload.type === "message.sent" ? "assistant" : "user";
          const content = role === "assistant" 
             ? `Sent email to ${Array.isArray(fullMsg.to) ? fullMsg.to.join(", ") : fullMsg.to}\nSubject: ${fullMsg.subject}\n\n${fullMsg.text || fullMsg.html || "(No content)"}`
             : `Email from ${fullMsg.from}\nSubject: ${fullMsg.subject}\n\n${fullMsg.text || fullMsg.html || fullMsg.preview || "(No content)"}`;

          await db.insert(chatMessages).values({
            sessionId: session.id,
            role: role,
            content: content,
            createdAt: fullMsg.createdAt ? new Date(fullMsg.createdAt) : new Date(),
            metadata: {
              isEmail: true,
              emailId: fullMsg.messageId,
              emailFrom: fullMsg.from,
              emailSubject: fullMsg.subject,
              emailTo: Array.isArray(fullMsg.to) ? fullMsg.to : [fullMsg.to],
              emailBody: fullMsg.text || fullMsg.html || fullMsg.preview || "(No content)",
              emailHtml: fullMsg.html,
            },
          });

          // 5. Update session timestamp
          await db
            .update(chatSessions)
            .set({ updatedAt: new Date() })
            .where(eq(chatSessions.id, session.id));

          // 6. Trigger AI response ONLY for received messages
          if (payload.type === "message.received") {
              try {
                // Fetch recent history including the new message
                const history = await db
                  .select()
                  .from(chatMessages)
                  .where(eq(chatMessages.sessionId, session.id))
                  .orderBy(chatMessages.createdAt);

                const conversationHistory = history.map((msg) => ({
                  role: msg.role as "user" | "assistant" | "system",
                  content: msg.content,
                }));

                // Generate AI response with server-side tRPC caller
                const ctx = await createTRPCContext();
                const serverCaller = appRouter.createCaller(ctx);
                const aiResponse = await getAIResponse(conversationHistory, session.id, serverCaller);

                // Save assistant message
                await db.insert(chatMessages).values({
                  sessionId: session.id,
                  role: "assistant",
                  content: aiResponse.content,
                  toolCalls: aiResponse.toolCalls,
                });
                
                console.log(`AI responded to email for session ${session.id}`);
              } catch (aiError) {
                console.error("Failed to generate AI response for webhook email:", aiError);
              }
          }

          console.log(`Processed email ${message_id} (${payload.type}) for session ${session.id}`);
          return NextResponse.json({ status: "ok" });
      }
    }

    return NextResponse.json({ status: "ignored", reason: "unhandled_type" });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ status: "error", message: String(e) }, { status: 500 });
  }
}

