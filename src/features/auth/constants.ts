export const AUTH_POLICY = {
  PASSWORD_MIN_LENGTH: 8,
} as const;

export const USER_ROLES = {
  advertiser: 'advertiser',
  influencer: 'influencer',
} as const;

export type UserRole = keyof typeof USER_ROLES;

