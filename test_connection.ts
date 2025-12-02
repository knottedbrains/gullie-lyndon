import "dotenv/config";
import { AgentMailClient } from "agentmail";

const apiKey = process.env.AGENTMAIL_API_KEY;
console.log("Using API Key:", apiKey ? "Present (starts with " + apiKey.substring(0, 5) + ")" : "Missing");

const client = new AgentMailClient({ apiKey: apiKey || "test" });

async function test() {
    try {
        console.log("Attempting to create inbox...");
        const inbox = await client.inboxes.create({ displayName: "Test Connectivity" });
        console.log("Success! Inbox created:", inbox.inboxId);
    } catch (e: any) {
        console.log("Error creating inbox:", e.message);
        if (e.body) console.log("Body:", JSON.stringify(e.body));
    }
}
test();
