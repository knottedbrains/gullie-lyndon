import "dotenv/config";
import { AgentMailClient } from "agentmail";

const client = new AgentMailClient({ apiKey: process.env.AGENTMAIL_API_KEY || "" });

async function cleanup() {
    try {
        console.log("Listing inboxes...");
        const response = await client.inboxes.list();
        console.log(`Found ${response.count} inboxes.`);
        
        // @ts-ignore - handling potential array vs object response
        const inboxes = response.inboxes || response.data || [];
        
        if (inboxes.length > 0) {
            console.log("Deleting oldest 5 inboxes to free up space...");
            // Sort by createdAt if available, or just take the first ones
            // Assuming the list returns them in some order.
            
            for (const inbox of inboxes.slice(0, 5)) {
                const id = inbox.inboxId;
                console.log(`Deleting inbox: ${id}`);
                await client.inboxes.delete(id);
            }
            console.log("Cleanup complete.");
        }
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}
cleanup();

