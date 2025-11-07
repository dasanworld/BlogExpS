"use client";
import { useEffect, useMemo, useState } from "react";
import { INFLUENCER_API_ROUTES } from "@/features/influencer/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { INFLUENCER_MESSAGES } from "@/features/influencer/messages";

type Channel = {
  id?: string;
  platform: string;
  name: string;
  url: string;
  _op?: "upsert" | "delete";
  verificationStatus?: "pending" | "verified" | "failed";
};

type ProfileResponse = {
  profileCompleted: boolean;
  birthDate?: string | null;
  channels: Array<Required<Channel>>;
  verifiedCount?: number;
};

export default function InfluencerProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => birthDate.length === 10 && channels.some((c) => c._op !== "delete"), [birthDate, channels]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const access = data.session?.access_token;
        const headers: Record<string, string> = { };
        if (access) headers["Authorization"] = `Bearer ${access}`;
        const res = await fetch(INFLUENCER_API_ROUTES.me, { cache: "no-store", headers });
        if (res.ok) {
          const json: ProfileResponse = await res.json();
          if (mounted) {
            setChannels(json.channels.map((c) => ({ ...c, _op: "upsert" })));
            setBirthDate(json.birthDate ?? "");
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onAddChannel = () => {
    setChannels((prev) => [...prev, { platform: "", name: "", url: "", _op: "upsert" }]);
  };

  const onChangeChannel = (idx: number, patch: Partial<Channel>) => {
    setChannels((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const onDeleteChannel = (idx: number) => {
    setChannels((prev) => prev.map((c, i) => (i === idx ? { ...c, _op: "delete" } : c)));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const access = data.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (access) headers["Authorization"] = `Bearer ${access}`;
      const res = await fetch(INFLUENCER_API_ROUTES.save, {
        method: "POST",
        headers,
        body: JSON.stringify({ birthDate, channels }),
      });
      const json: ProfileResponse | { error?: { message?: string } } = await res.json();
      if (res.ok) {
        const payload = json as ProfileResponse;
        setMessage(INFLUENCER_MESSAGES.save.success);
        setBirthDate(payload.birthDate ?? "");
        setChannels(payload.channels.map((c: any) => ({ ...c, _op: "upsert" })));
      } else {
        setMessage((json as any)?.error?.message ?? "오류가 발생했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const access = data.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (access) headers["Authorization"] = `Bearer ${access}`;
      const res = await fetch(INFLUENCER_API_ROUTES.submit, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const json: ProfileResponse | { error?: { message?: string } } = await res.json();
      if (res.ok) {
        const data = json as ProfileResponse;
        if (typeof data.verifiedCount === "number" && data.verifiedCount > 0) {
          setMessage(`검증된 채널 ${data.verifiedCount}개 확인되어 프로필이 완료되었습니다.`);
        } else {
          setMessage(INFLUENCER_MESSAGES.submit.success);
        }
        setBirthDate(data.birthDate ?? "");
        setChannels(data.channels.map((c: any) => ({ ...c, _op: "upsert" })));
      } else {
        setMessage((json as any)?.error?.message ?? "오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">인플루언서 정보 등록</h1>
      {loading ? <p>로딩 중…</p> : null}
      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm">
            생년월일
            <span className="ml-1 text-red-500" aria-hidden>
              *
            </span>
          </span>
          <input
            type="date"
            className="border rounded px-2 py-1 w-full text-sm"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            placeholder="예: 1990-01-01"
            aria-required
            required
          />
          <span className="mt-1 block text-xs text-gray-500">예: 1990-01-01 (클릭하여 달력에서 선택)</span>
        </label>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">SNS 채널</span>
            <button className="text-blue-600 text-sm" type="button" onClick={onAddChannel}>
              + 채널 추가
            </button>
          </div>
          <div className="space-y-2">
            {channels.map((c, idx) => (
              <div key={idx} className="border rounded p-2">
                {c._op === "delete" ? (
                  <div className="text-gray-500 text-sm">삭제 예정</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600">
                        플랫폼
                        <span className="ml-0.5 text-red-500" aria-hidden>*</span>
                      </label>
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="예: instagram / youtube"
                        value={c.platform}
                        onChange={(e) => onChangeChannel(idx, { platform: e.target.value })}
                        aria-required
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600">
                        채널명
                        <span className="ml-0.5 text-red-500" aria-hidden>*</span>
                      </label>
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="예: my_handle"
                        value={c.name}
                        onChange={(e) => onChangeChannel(idx, { name: e.target.value })}
                        aria-required
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600">
                        채널 URL
                        <span className="ml-0.5 text-red-500" aria-hidden>*</span>
                      </label>
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="예: https://instagram.com/my_handle"
                        value={c.url}
                        onChange={(e) => onChangeChannel(idx, { url: e.target.value })}
                        aria-required
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <button className="text-red-600 text-sm" type="button" onClick={() => onDeleteChannel(idx)}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button disabled={saving} onClick={save} className="border rounded px-3 py-1">
            {saving ? "저장 중…" : "임시저장"}
          </button>
          <button disabled={submitting || !canSubmit} onClick={submit} className="border rounded px-3 py-1">
            {submitting ? "제출 중…" : "제출"}
          </button>
        </div>

        {message ? <p className="text-sm text-gray-700">{message}</p> : null}
      </div>
    </div>
  );
}
