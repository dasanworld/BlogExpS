export const INFLUENCER_MESSAGES = {
  save: {
    success: '프로필이 저장되었습니다.',
  },
  submit: {
    success: '프로필이 완료되었습니다.',
  },
  guard: {
    verifiedRequired: '최소 1개 이상의 검증된 채널이 필요합니다.',
  },
  error: {
    policyAge: '최소 연령 정책을 충족하지 않습니다.',
    maxChannels: '등록 가능한 채널 수를 초과했습니다.',
    urlInvalid: '채널 URL 형식이 올바르지 않습니다.',
    duplicated: '중복된 채널 항목이 있습니다.',
    unauthorized: '로그인이 필요합니다.',
    forbidden: '접근 권한이 없습니다.',
  },
} as const;

