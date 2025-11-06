export const influencerErrorCodes = {
  unauthorized: 'UNAUTHORIZED',
  forbiddenRole: 'FORBIDDEN_ROLE',
  invalidPayload: 'INVALID_PAYLOAD',
  policyAgeViolation: 'POLICY_AGE_VIOLATION',
  policyMaxChannels: 'POLICY_MAX_CHANNELS',
  channelUrlInvalid: 'CHANNEL_URL_INVALID',
  channelDuplicated: 'CHANNEL_DUPLICATED',
  dbTxFailed: 'DB_TX_FAILED',
  submitVerifiedRequired: 'SUBMIT_VERIFIED_REQUIRED',
} as const;

export type InfluencerErrorCode = (typeof influencerErrorCodes)[keyof typeof influencerErrorCodes];

