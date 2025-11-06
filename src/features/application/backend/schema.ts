import { z } from 'zod';

export const MOTIVATION_MIN = 1 as const;
export const MOTIVATION_MAX = 1000 as const;

export const CreateApplicationBodySchema = z
  .object({
    campaignId: z.string().uuid(),
    motivation: z.string().trim().min(MOTIVATION_MIN).max(MOTIVATION_MAX),
    visitDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  })
  .strict();

export type CreateApplicationBody = z.infer<typeof CreateApplicationBodySchema>;

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  influencer_id: z.string().uuid(),
  motivation: z.string(),
  visit_date: z.string(),
  status: z.enum(['applied', 'selected', 'rejected']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Application = z.infer<typeof ApplicationSchema>;

export const CreateApplicationResponseSchema = z.object({
  application: ApplicationSchema,
});

export type CreateApplicationResponse = z.infer<typeof CreateApplicationResponseSchema>;

export const MyApplicationsQuerySchema = z
  .object({
    status: z.enum(['all', 'applied', 'selected', 'rejected']).default('all'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
    sort: z.enum(['recent']).default('recent'),
  })
  .strict();

export type MyApplicationsQuery = z.infer<typeof MyApplicationsQuerySchema>;

export const CampaignSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  recruitment_start_date: z.string(),
  recruitment_end_date: z.string(),
  status: z.enum(['recruiting', 'closed', 'selection_complete']),
});

export type CampaignSummary = z.infer<typeof CampaignSummarySchema>;

export const MyApplicationsResponseSchema = z.object({
  items: z.array(
    z.object({
      application: ApplicationSchema,
      campaign: CampaignSummarySchema,
    }),
  ),
  meta: z.object({ page: z.number(), pageSize: z.number(), total: z.number(), totalPages: z.number() }),
});

export type MyApplicationsResponse = z.infer<typeof MyApplicationsResponseSchema>;
