export const advertiserCampaignManageErrorCodes = {
  notFound: 'NOT_FOUND',
  invalidStateTransition: 'INVALID_STATE_TRANSITION',
  invalidQueryParams: 'INVALID_QUERY_PARAMS',
  invalidPayload: 'INVALID_PAYLOAD',
  profileIncomplete: 'PROFILE_INCOMPLETE',
  dbTxFailed: 'DB_TX_FAILED',
  ownershipForbidden: 'OWNERSHIP_FORBIDDEN',
  validationMismatch: 'VALIDATION_MISMATCH',
} as const;

export type AdvertiserCampaignManageErrorCode =
  (typeof advertiserCampaignManageErrorCodes)[keyof typeof advertiserCampaignManageErrorCodes];

