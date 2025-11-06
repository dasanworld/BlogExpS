import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import type { SignupRequest, SignupResponse } from './schema';
import { authErrorCodes } from './error';
import { AUTH_MESSAGES } from '@/features/auth/messages';

export const signupOrchestrate = async (
  supabase: SupabaseClient,
  payload: SignupRequest,
): Promise<HandlerResult<SignupResponse, typeof authErrorCodes[keyof typeof authErrorCodes], unknown>> => {
  const { email, password, name, phone, role } = payload;

  const authResult = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone, role },
    },
  });
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
      const err = insertResult.error as { code?: string; message: string };
      // Duplicate (already bootstrapped) → treat as success
      if (err?.code === '23505') {
        // continue
      } else {
        // Surface details to help diagnosis (e.g., missing table, enum mismatch)
        const hint = err?.code === '42P01'
          ? '데이터베이스 마이그레이션이 적용되지 않았습니다. user_profiles 테이블을 생성하세요.'
          : undefined;
        return failure(
          500,
          authErrorCodes.profileBootstrapFailed,
          hint ? `${err.message} (${hint})` : err.message,
        );
      }
    }
  }

  const hasSession = Boolean(authResult.data.session);
  return success(
    {
      userId: user?.id,
      nextAction: hasSession ? 'session_active' : 'verify_email',
      message: hasSession
        ? AUTH_MESSAGES.signup.sessionActive
        : AUTH_MESSAGES.signup.verifyEmail,
    },
    201,
  );
};
