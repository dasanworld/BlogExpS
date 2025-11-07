import { z } from 'zod';

export const CampaignStatusEnum = z.enum([
  'recruiting',
  'closed',
  'selection_complete',
]);

export const CampaignSortEnum = z.enum(['recent', 'popular']);

export const CampaignListQuerySchema = z
  .object({
    status: CampaignStatusEnum.default('recruiting'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
    sort: CampaignSortEnum.default('recent'),
    category: z.string().trim().min(1).optional(),
    location: z.string().trim().min(1).optional(),
    keyword: z.string().trim().min(1).optional(),
    benefitType: z.string().trim().min(1).optional(),
  })
  .strict();

export type CampaignListQuery = z.infer<typeof CampaignListQuerySchema>;

export const CampaignItemSchema = z.object({
  id: z.string().uuid(),
  advertiser_id: z.string().uuid(),
  title: z.string(),
  recruitment_start_date: z.string(), // ISO date
  recruitment_end_date: z.string(), // ISO date
  recruitment_count: z.number(),
  benefits: z.string(),
  mission: z.string(),
  store_info: z.string(),
  status: CampaignStatusEnum,
  created_at: z.string(),
  updated_at: z.string(),
});

export type CampaignItem = z.infer<typeof CampaignItemSchema>;

export const CampaignListResponseSchema = z.object({
  items: z.array(CampaignItemSchema),
  meta: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
  }),
});

export type CampaignListResponse = z.infer<typeof CampaignListResponseSchema>;

export const CampaignIdParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const ApplyEligibilitySchema = z.object({
  allowed: z.boolean(),
  reason: z
    .enum([
      'UNAUTHENTICATED',
      'FORBIDDEN_ROLE',
      'INFLUENCER_PROFILE_INCOMPLETE',
      'CAMPAIGN_NOT_RECRUITING',
    ])
    .optional(),
});

export const CampaignDetailSchema = CampaignItemSchema;
export type CampaignDetail = z.infer<typeof CampaignDetailSchema>;

export const CampaignDebugSchema = z.object({
  serverNowIso: z.string(),
  seoulTodayIndex: z.number(),
  startIndex: z.number().nullable(),
  endIndex: z.number().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  status: CampaignStatusEnum,
});
export type CampaignDebug = z.infer<typeof CampaignDebugSchema>;

export const CampaignDetailResponseSchema = z.object({
  campaign: CampaignDetailSchema,
  applyEligibility: ApplyEligibilitySchema.optional(),
  debug: CampaignDebugSchema.optional(),
});
export type CampaignDetailResponse = z.infer<typeof CampaignDetailResponseSchema>;
