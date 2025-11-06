export const advertiserErrorCodes = {
  unauthorized: 'UNAUTHORIZED',
  forbiddenRole: 'FORBIDDEN_ROLE',
  invalidPayload: 'INVALID_PAYLOAD',
  duplicateBusinessNumber: 'DUPLICATE_BUSINESS_NUMBER',
  dbTxFailed: 'DB_TX_FAILED',
  validationMismatch: 'VALIDATION_MISMATCH',
} as const;

export type AdvertiserErrorCode =
  (typeof advertiserErrorCodes)[keyof typeof advertiserErrorCodes];

