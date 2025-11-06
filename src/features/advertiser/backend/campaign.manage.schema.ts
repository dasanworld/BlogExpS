import { z } from 'zod';
import { CampaignItemSchema, CampaignIdParamsSchema } from '@/features/campaign/backend/schema';
import { ApplicationSchema } from '@/features/application/backend/schema';

export const ApplicantsListItemSchema = z.object({
  id: z.string().uuid(),
  influencer_id: z.string().uuid(),
  status: ApplicationSchema.shape.status, // reuse enum
  motivation: z.string(),
  created_at: z.string(),
});

export type ApplicantsListItem = z.infer<typeof ApplicantsListItemSchema>;

export const CampaignDetailForOwnerSchema = z.object({
  campaign: CampaignItemSchema,
  applicants: z.array(ApplicantsListItemSchema),
});

export type CampaignDetailForOwner = z.infer<typeof CampaignDetailForOwnerSchema>;

export const CloseRequestSchema = z.object({}).strict();
export type CloseRequest = z.infer<typeof CloseRequestSchema>;

export const SelectionRequestSchema = z
  .object({
    selectedIds: z.array(z.string().uuid()).default([]),
  })
  .strict()
  .superRefine((val, ctx) => {
    const seen = new Set<string>();
    for (const id of val.selectedIds) {
      if (seen.has(id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate id', path: ['selectedIds'] });
        break;
      }
      seen.add(id);
    }
  });

export type SelectionRequest = z.infer<typeof SelectionRequestSchema>;

export { CampaignIdParamsSchema };

