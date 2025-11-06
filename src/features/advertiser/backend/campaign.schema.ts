import { z } from 'zod';
import { PaginationSchema, SortSchema } from '@/shared/validators/pagination';
import {
  CampaignItemSchema,
  CampaignListResponseSchema,
  CampaignStatusEnum,
  CampaignSortEnum,
} from '@/features/campaign/backend/schema';

// status filter for advertiser's own campaigns supports 'all'
export const MyCampaignStatusFilterSchema = z.union([
  z.literal('all'),
  CampaignStatusEnum,
]);

export const MyCampaignListQuerySchema = PaginationSchema.extend({
  status: MyCampaignStatusFilterSchema.default('all'),
  sort: CampaignSortEnum.default('recent').or(SortSchema.default('recent')),
}).strict();

export type MyCampaignListQuery = z.infer<typeof MyCampaignListQuerySchema>;

export const CampaignCreateRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    recruitment_start_date: z.string().trim().min(1), // ISO date (YYYY-MM-DD)
    recruitment_end_date: z.string().trim().min(1), // ISO date (YYYY-MM-DD)
    recruitment_count: z.coerce.number().int().min(1),
    benefits: z.string().trim().min(1),
    mission: z.string().trim().min(1),
    store_info: z.string().trim().min(1),
  })
  .strict()
  .superRefine((val, ctx) => {
    // Basic ISO date shape check and start <= end
    const start = new Date(val.recruitment_start_date);
    const end = new Date(val.recruitment_end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid date format',
        path: ['recruitment_start_date'],
      });
      return;
    }
    if (start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must be before or equal to end date',
        path: ['recruitment_start_date'],
      });
    }
  });

export type CampaignCreateRequest = z.infer<typeof CampaignCreateRequestSchema>;

export const MyCampaignListResponseSchema = CampaignListResponseSchema;
export const AdvertiserCampaignItemSchema = CampaignItemSchema;
export type AdvertiserCampaignItem = z.infer<typeof AdvertiserCampaignItemSchema>;

