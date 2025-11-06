export const authErrorCodes = {
  invalidSignupPayload: 'INVALID_SIGNUP_PAYLOAD',
  authSignupFailed: 'AUTH_SIGNUP_FAILED',
  profileBootstrapFailed: 'PROFILE_BOOTSTRAP_FAILED',
  rateLimited: 'RATE_LIMITED',
} as const;

export type AuthErrorCode = (typeof authErrorCodes)[keyof typeof authErrorCodes];

