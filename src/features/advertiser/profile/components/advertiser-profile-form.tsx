"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { ADVERTISER_API_ROUTES } from "@/features/advertiser/routes";
import { ADVERTISER_MESSAGES } from "@/features/advertiser/messages";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { GlobalNavigation } from "@/features/layout/components/global-navigation";

const FormSchema = z.object({
  companyName: z.string().min(1, "업체명을 입력하세요"),
  location: z.string().min(1, "위치를 입력하세요"),
  category: z.string().min(1, "카테고리를 입력하세요"),
  businessRegistrationNumber: z.string().min(1, "사업자등록번호를 입력하세요"),
});

export type AdvertiserProfileFormProps = {
  initialValues?: Partial<z.infer<typeof FormSchema>>;
  initialStatus?: {
    profileCompleted?: boolean;
    verificationStatus?: "pending" | "verified" | "failed";
  };
};

export function AdvertiserProfileForm({ initialValues, initialStatus }: AdvertiserProfileFormProps) {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(initialStatus ?? null);
  const [fetching, setFetching] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      companyName: initialValues?.companyName ?? "",
      location: initialValues?.location ?? "",
      category: initialValues?.category ?? "",
      businessRegistrationNumber: initialValues?.businessRegistrationNumber ?? "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      companyName: initialValues?.companyName ?? "",
      location: initialValues?.location ?? "",
      category: initialValues?.category ?? "",
      businessRegistrationNumber: initialValues?.businessRegistrationNumber ?? "",
    });
    setStatus(initialStatus ?? null);
  }, [initialValues, initialStatus, form]);

  useEffect(() => {
    const run = async () => {
      setFetching(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const session = await supabase.auth.getSession();
        const access = session.data.session?.access_token;
        if (!access) {
          setServerMessage("로그인이 필요합니다.");
          return;
        }
        const headers: Record<string, string> = { Authorization: `Bearer ${access}` };
        const res = await apiClient.get(ADVERTISER_API_ROUTES.me, { headers, withCredentials: true });
        form.reset({
          companyName: res.data.companyName ?? "",
          location: res.data.location ?? "",
          category: res.data.category ?? "",
          businessRegistrationNumber: res.data.businessRegistrationNumber ?? "",
        });
        setStatus({
          profileCompleted: Boolean(res.data.profileCompleted),
          verificationStatus: res.data.verificationStatus ?? "pending",
        });
      } catch (error) {
        setServerMessage(extractApiErrorMessage(error, "프로필 정보를 불러오지 못했습니다."));
      } finally {
        setFetching(false);
      }
    };
    void run();
  }, [form]);

  const onSaveDraft = useCallback(
    async (values: z.infer<typeof FormSchema>) => {
      setServerMessage(null);
      setSaving(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const session = await supabase.auth.getSession();
        const access = session.data.session?.access_token;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (access) headers["Authorization"] = `Bearer ${access}`;
        await apiClient.post(ADVERTISER_API_ROUTES.save, values, { headers, withCredentials: true });
        toast({ title: ADVERTISER_MESSAGES.save.success });
        setServerMessage(ADVERTISER_MESSAGES.save.success);
      } catch (error) {
        const msg = extractApiErrorMessage(error, ADVERTISER_MESSAGES.error.server);
        toast({ title: "저장 실패", description: msg });
        setServerMessage(msg);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const onSubmitFinal = useCallback(async () => {
    setServerMessage(null);
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const session = await supabase.auth.getSession();
      const access = session.data.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (access) headers["Authorization"] = `Bearer ${access}`;
      await apiClient.post(ADVERTISER_API_ROUTES.submit, {}, { headers, withCredentials: true });
      toast({ title: ADVERTISER_MESSAGES.submit.success });
      router.replace("/advertisers/dashboard");
    } catch (error) {
      const msg = extractApiErrorMessage(error, ADVERTISER_MESSAGES.error.server);
      toast({ title: "제출 실패", description: msg });
      setServerMessage(msg);
    } finally {
      setSubmitting(false);
    }
  }, [router]);

  const statusLabel = useMemo(() => {
    if (!status) return null;
    const badgeVariant =
      status.verificationStatus === "verified"
        ? "default"
        : status.verificationStatus === "failed"
        ? "destructive"
        : "secondary";
    return (
      <div className="flex items-center gap-2">
        <Badge variant={badgeVariant as any}>검증: {status.verificationStatus}</Badge>
        <Badge variant={status.profileCompleted ? "default" : "secondary" as any}>
          프로필: {status.profileCompleted ? "완료" : "진행중"}
        </Badge>
      </div>
    );
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/40 to-white text-slate-900">
      <GlobalNavigation
        links={[
          { label: "홈", href: "/" },
          { label: "광고주 대시보드", href: "/advertisers/dashboard" },
          { label: "광고주 프로필", href: "/advertisers/profile" },
        ]}
      />
      <main className="mx-auto max-w-3xl px-6 pb-12 pt-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-500/80">Advertiser Profile</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">광고주 정보 등록</h1>
          <p className="text-sm text-slate-500">회사 기본 정보를 입력해 프로필을 완료하세요.</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>프로필 정보</CardTitle>
                <CardDescription>필수 항목을 모두 입력하면 체험단 등록이 가능해집니다.</CardDescription>
              </div>
              {!fetching && statusLabel}
            </div>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <p className="text-sm text-slate-500">프로필 정보를 불러오는 중...</p>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSaveDraft)} className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>업체명</FormLabel>
                        <FormControl>
                          <Input placeholder="예) 오렌지 컴퍼니" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>위치</FormLabel>
                        <FormControl>
                          <Input placeholder="예) 서울시 강남구" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>카테고리</FormLabel>
                        <FormControl>
                          <Input placeholder="예) F&B, 리테일 등" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessRegistrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>사업자등록번호</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" placeholder="숫자만 입력" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={!form.formState.isValid || saving}>
                      {saving ? "저장 중..." : "임시저장"}
                    </Button>
                    <Button type="button" variant="outline" onClick={onSubmitFinal} disabled={submitting || !form.formState.isValid}>
                      {submitting ? "제출 중..." : "제출"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
            {serverMessage && <p className="mt-3 text-sm text-muted-foreground">{serverMessage}</p>}
          </CardContent>
          <CardFooter />
        </Card>
      </main>
    </div>
  );
}
