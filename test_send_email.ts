import "dotenv/config";
import { AgentMailClient } from "agentmail";

const apiKey = process.env.AGENTMAIL_API_KEY;
if (!apiKey) {
  console.error("AGENTMAIL_API_KEY is not set in .env file");
  process.exit(1);
}

const client = new AgentMailClient({ apiKey });

async function testSendEmail() {
  try {
    console.log("📧 Testing AgentMail email sending...\n");
    
    // Step 1: Use the known working inbox from logs
    console.log("1. Using known working inbox...");
    const inboxId = "happyemployee397@agentmail.to";  // Use full email format as required by API
    const fromEmail = inboxId;
    
    console.log(`   ✓ Using inbox: ${inboxId}`);
    
    // Step 2: Send test email
    console.log("\n2. Sending test email...");
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: l.leong1618@gmail.com`);
    
    // Use the full email address as inbox_id (as required by API)
    const result = await client.inboxes.messages.send(inboxId, {
      to: ["l.leong1618@gmail.com"],
      subject: "Test Email from AgentMail",
      text: `Hello!

This is a test email sent from the AgentMail API using your API key.

Inbox ID: ${inboxId}
Email Address: ${fromEmail}
Sent at: ${new Date().toISOString()}

If you receive this email, the AgentMail integration is working correctly! 🎉

Best regards,
AgentMail Test Script
`,
    });
    
    console.log("   ✓ Email sent successfully!");
    console.log(`   Message ID: ${result.messageId || "N/A"}`);
    console.log("\n✅ Test completed successfully! Check your inbox at l.leong1618@gmail.com");
    
  } catch (e: any) {
    console.error("\n❌ Error sending email:");
    console.error(`   Message: ${e.message}`);
    if (e.body) {
      console.error(`   Body: ${JSON.stringify(e.body, null, 2)}`);
    }
    if (e.statusCode) {
      console.error(`   Status Code: ${e.statusCode}`);
    }
    console.error("\nFull error:", e);
    process.exit(1);
  }
}

testSendEmail();

