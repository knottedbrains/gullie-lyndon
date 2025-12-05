import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { companySettings, employers } from "../db/schema";
import { eq } from "drizzle-orm";

export const companiesRouter = createTRPCRouter({
  getSettings: publicProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [settings] = await ctx.db
        .select()
        .from(companySettings)
        .where(eq(companySettings.employerId, input.companyId))
        .limit(1);

      // If no settings exist, return defaults
      if (!settings) {
        return {
          enableBudgetTracking: true,
          requireApprovals: false,
          autoCreateHousingConversation: true,
          autoCreateMovingConversation: true,
          autoCreateServicesConversation: true,
        };
      }

      return settings;
    }),

  updateSettings: publicProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        settings: z.object({
          enableBudgetTracking: z.boolean().optional(),
          requireApprovals: z.boolean().optional(),
          autoCreateHousingConversation: z.boolean().optional(),
          autoCreateMovingConversation: z.boolean().optional(),
          autoCreateServicesConversation: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if settings exist
      const [existing] = await ctx.db
        .select()
        .from(companySettings)
        .where(eq(companySettings.employerId, input.companyId))
        .limit(1);

      if (existing) {
        // Update existing settings
        const [updated] = await ctx.db
          .update(companySettings)
          .set({
            ...input.settings,
            updatedAt: new Date(),
          })
          .where(eq(companySettings.employerId, input.companyId))
          .returning();
        return updated;
      } else {
        // Create new settings
        const [newSettings] = await ctx.db
          .insert(companySettings)
          .values({
            employerId: input.companyId,
            ...input.settings,
          })
          .returning();
        return newSettings;
      }
    }),
});
