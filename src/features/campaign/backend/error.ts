export const campaignErrorCodes = {
  invalidQueryParams: 'INVALID_QUERY_PARAMS',
  fetchError: 'FETCH_ERROR',
} as const;

export type CampaignServiceError =
  | {
      code: typeof campaignErrorCodes.invalidQueryParams;
      message: string;
      details?: unknown;
    }
  | {
      code: typeof campaignErrorCodes.fetchError;
      message: string;
      details?: unknown;
    };

