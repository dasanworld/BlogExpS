import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import type { SignupRequest, SignupResponse } from './schema';
import { authErrorCodes } from './error';

export const signupOrchestrate = async (
  supabase: SupabaseClient,
  payload: SignupRequest,
): Promise<HandlerResult<SignupResponse, typeof authErrorCodes[keyof typeof authErrorCodes], unknown>> => {
  const { email, password, name, phone, role } = payload;

  const authResult = await supabase.auth.signUp({ email, password });
  if (authResult.error) {
    return failure(400, authErrorCodes.authSignupFailed, authResult.error.message);
  }

  const user = authResult.data.user;

  if (user) {
    const insertResult = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        name,
        phone,
        email,
        role,
        terms_agreed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertResult.error) {
      return failure(500, authErrorCodes.profileBootstrapFailed, '프로필 초기화에 실패했습니다.', insertResult.error.message);
    }
  }

  const hasSession = Boolean(authResult.data.session);
  return success(
    {
      userId: user?.id,
      nextAction: hasSession ? 'session_active' : 'verify_email',
      message: hasSession
        ? '가입이 완료되었습니다.'
        : '확인 이메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.',
    },
    201,
  );
};

