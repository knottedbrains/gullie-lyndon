import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function listModels() {
  try {
    console.log("🔍 Fetching available OpenAI models...\n");

    const models = await openai.models.list();

    // Filter and categorize models
    const gptModels = models.data.filter(m => m.id.includes("gpt"));
    const o1Models = models.data.filter(m => m.id.includes("o1"));
    const o3Models = models.data.filter(m => m.id.includes("o3"));
    const chatgptModels = models.data.filter(m => m.id.includes("chatgpt"));

    console.log("📊 GPT Models:");
    gptModels.forEach(m => console.log(`  - ${m.id}`));

    console.log("\n🧠 o1 Models (Reasoning):");
    o1Models.forEach(m => console.log(`  - ${m.id}`));

    console.log("\n🧠 o3 Models (Latest Reasoning):");
    o3Models.forEach(m => console.log(`  - ${m.id}`));

    console.log("\n💬 ChatGPT Models:");
    chatgptModels.forEach(m => console.log(`  - ${m.id}`));

    console.log("\n\n📋 All Available Models:");
    models.data
      .filter(m =>
        m.id.includes("gpt") ||
        m.id.includes("o1") ||
        m.id.includes("o3") ||
        m.id.includes("chatgpt")
      )
      .forEach(m => console.log(`  "${m.id}",`));

  } catch (error) {
    console.error("❌ Error fetching models:", error);
  }
}

listModels();
