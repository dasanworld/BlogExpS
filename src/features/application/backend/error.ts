export const applicationErrorCodes = {
  unauthorized: 'UNAUTHORIZED',
  forbiddenRole: 'FORBIDDEN_ROLE',
  invalidBody: 'INVALID_BODY',
  campaignNotFound: 'CAMPAIGN_NOT_FOUND',
  campaignNotRecruiting: 'CAMPAIGN_NOT_RECRUITING',
  profileIncomplete: 'PROFILE_INCOMPLETE',
  duplicateApplication: 'DUPLICATE_APPLICATION',
  fetchError: 'FETCH_ERROR',
  insertError: 'INSERT_ERROR',
} as const;

export type ApplicationServiceError =
  | { code: typeof applicationErrorCodes.unauthorized; message: string; details?: unknown }
  | { code: typeof applicationErrorCodes.forbiddenRole; message: string; details?: unknown }
  | { code: typeof applicationErrorCodes.invalidBody; message: string; details?: unknown }
  | { code: typeof applicationErrorCodes.campaignNotFound; message: string; details?: unknown }
  | { code: typeof applicationErrorCodes.campaignNotRecruiting; message: string; details?: unknown }
  | { code: typeof applicationErrorCodes.profileIncomplete; message: string; details?: unknown }
  | { code: typeof applicationErrorCodes.duplicateApplication; message: string; details?: unknown }
  | { code: typeof applicationErrorCodes.fetchError; message: string; details?: unknown }
  | { code: typeof applicationErrorCodes.insertError; message: string; details?: unknown };

