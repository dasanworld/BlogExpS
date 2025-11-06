"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { AUTH_API_ROUTES } from "@/features/auth/routes";
import { AUTH_MESSAGES } from "@/features/auth/messages";

const defaultFormState = {
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  phone: "",
  role: "" as "advertiser" | "influencer" | "",
  termsAgreed: false,
};

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignupPage({ params }: SignupPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useCurrentUser();
  const [formState, setFormState] = useState(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, router, searchParams]);

  const isSubmitDisabled = useMemo(
    () =>
      !formState.email.trim() ||
      !formState.password.trim() ||
      formState.password !== formState.confirmPassword ||
      !formState.name.trim() ||
      !formState.phone.trim() ||
      (formState.role !== "advertiser" && formState.role !== "influencer") ||
      !formState.termsAgreed,
    [
      formState.confirmPassword,
      formState.email,
      formState.password,
      formState.name,
      formState.phone,
      formState.role,
      formState.termsAgreed,
    ]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const el = event.currentTarget as HTMLInputElement | HTMLSelectElement;
      const { name } = el;

      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        setFormState((previous) => ({ ...previous, [name]: el.checked }));
        return;
      }

      setFormState((previous) => ({ ...previous, [name]: (el as HTMLInputElement | HTMLSelectElement).value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);
      setInfoMessage(null);

      if (formState.password !== formState.confirmPassword) {
        setErrorMessage(AUTH_MESSAGES.signup.invalidPasswordConfirm);
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch(AUTH_API_ROUTES.signup, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formState.email,
            password: formState.password,
            name: formState.name,
            phone: formState.phone,
            role: formState.role,
            termsAgreed: formState.termsAgreed,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          const message = payload?.error?.message ?? AUTH_MESSAGES.signup.genericFailure;
          setErrorMessage(message);
          setIsSubmitting(false);
          return;
        }

        const message: string = payload?.message ?? AUTH_MESSAGES.signup.sessionActive;
        setInfoMessage(message);
        router.prefetch('/login');
        setFormState(defaultFormState);
      } catch (error) {
        setErrorMessage(AUTH_MESSAGES.signup.processingError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formState.confirmPassword,
      formState.email,
      formState.password,
      formState.name,
      formState.phone,
      formState.role,
      formState.termsAgreed,
      router,
    ]
  );

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">회원가입</h1>
        <p className="text-slate-500">
          Supabase 계정으로 회원가입하고 프로젝트를 시작하세요.
        </p>
      </header>
      <div className="grid w-full gap-8 md:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            이메일
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={formState.email}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            이름
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              value={formState.name}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            휴대폰번호
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              required
              value={formState.phone}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            비밀번호
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={formState.password}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            비밀번호 확인
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={formState.confirmPassword}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            역할 선택
            <select
              name="role"
              required
              value={formState.role}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            >
              <option value="">선택하세요</option>
              <option value="advertiser">광고주</option>
              <option value="influencer">인플루언서</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="termsAgreed"
              checked={formState.termsAgreed}
              onChange={handleChange}
              className="h-4 w-4"
            />
            약관에 동의합니다(필수)
          </label>
          {errorMessage ? (
            <p className="text-sm text-rose-500">{errorMessage}</p>
          ) : null}
          {infoMessage ? (
            <p className="text-sm text-emerald-600">{infoMessage}</p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting || isSubmitDisabled}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "등록 중" : "회원가입"}
          </button>
          <p className="text-xs text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-slate-700 underline hover:text-slate-900"
            >
              로그인으로 이동
            </Link>
          </p>
        </form>
        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <Image
            src="https://picsum.photos/seed/signup/640/640"
            alt="회원가입"
            width={640}
            height={640}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
