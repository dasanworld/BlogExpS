export const advertiserCampaignErrorCodes = {
  unauthorized: 'UNAUTHORIZED',
  forbiddenRole: 'FORBIDDEN_ROLE',
  invalidQueryParams: 'INVALID_QUERY_PARAMS',
  invalidPayload: 'INVALID_PAYLOAD',
  profileIncomplete: 'PROFILE_INCOMPLETE',
  dbTxFailed: 'DB_TX_FAILED',
} as const;

export type AdvertiserCampaignErrorCode =
  (typeof advertiserCampaignErrorCodes)[keyof typeof advertiserCampaignErrorCodes];

