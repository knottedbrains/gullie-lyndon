import { AgentMailClient } from "agentmail";

const apiKey = process.env.AGENTMAIL_API_KEY;

if (!apiKey) {
  console.warn("AGENTMAIL_API_KEY is not set");
}

export const agentMail = new AgentMailClient({
  apiKey: apiKey || "dummy_key",
});

export interface SendEmailParams {
  inboxId: string;
  to: string[];
  subject: string;
  body: string; // The content
  cc?: string[];
  bcc?: string[];
}

export const emailService = {
  async createInbox(name: string) {
    return await agentMail.inboxes.create({
      displayName: name,
    });
  },

  async getInbox(inboxId: string) {
    return await agentMail.inboxes.get(inboxId);
  },

  async sendEmail({ inboxId, to, subject, body, cc, bcc }: SendEmailParams) {
    try {
      console.log(`[EmailService] Sending email from inbox ${inboxId} to ${to.join(", ")}`);
      const result = await agentMail.inboxes.messages.send(inboxId, {
        to,
        subject,
        text: body,
        cc,
        bcc,
      });
      console.log(`[EmailService] Email sent successfully:`, result);
      return result;
    } catch (error) {
      console.error(`[EmailService] Failed to send email:`, error);
      throw error;
    }
  },

  async listMessages(inboxId: string) {
    return await agentMail.inboxes.messages.list(inboxId);
  },
  
  async getMessage(inboxId: string, messageId: string) {
    return await agentMail.inboxes.messages.get(inboxId, messageId);
  }
};

