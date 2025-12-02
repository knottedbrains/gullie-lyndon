import { z } from "zod";
import { createTool, callTRPCProcedure } from "./builder";

export const emailTools = [
  createTool("send_email")
    .describe("Send an email to one or more recipients from the current conversation's email address.")
    .input(
      z.object({
        to: z.array(z.string()).describe("List of email addresses to send to"),
        subject: z.string().describe("Subject of the email"),
        body: z.string().describe("Body content of the email"),
        cc: z.array(z.string()).optional().describe("List of email addresses to CC"),
        bcc: z.array(z.string()).optional().describe("List of email addresses to BCC"),
      })
    )
    .handler(async (input, { trpc, sessionId }) => {
      if (!sessionId) {
        return { error: "Session ID is required to send email" };
      }
      
      try {
        console.log(`[send_email tool] Attempting to send email to ${input.to.join(", ")}`);
        const result = await callTRPCProcedure(trpc.chat.sendEmail, {
          sessionId,
          to: input.to,
          subject: input.subject,
          body: input.body,
          cc: input.cc,
          bcc: input.bcc,
        }, true);
        
        console.log(`[send_email tool] Email send completed with result:`, result);
        return { 
          success: true, 
          message: `Email sent to ${input.to.join(", ")}`,
          details: result 
        };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`[send_email tool] Error sending email:`, errorMessage, e);
        return { 
            success: false, 
            error: errorMessage 
        };
      }
    }),
    
    createTool("sync_emails")
      .describe("Check for new emails in the current conversation inbox.")
      .input(z.object({}))
      .handler(async (_, { trpc, sessionId }) => {
        if (!sessionId) {
            return { error: "Session ID is required to sync emails" };
        }
        try {
            const result = await callTRPCProcedure(trpc.chat.syncEmails, { sessionId }, true);
            return {
                success: true,
                message: result.count > 0 ? `Found ${result.count} new emails.` : "No new emails found.",
                count: result.count
            };
        } catch (e) {
            return { success: false, error: e instanceof Error ? e.message : String(e) };
        }
      })
];

