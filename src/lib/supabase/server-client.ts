import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/constants/env";
import type { Database } from "./types";

type WritableCookieStore = Awaited<ReturnType<typeof cookies>> & {
  set?: (options: {
    name: string;
    value: string;
    path?: string;
    expires?: Date;
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
  }) => void;
};

export const createSupabaseServerClient = async (): Promise<
  SupabaseClient<Database>
> => {
  const cookieStore = (await cookies()) as WritableCookieStore;

  const canSetCookies = typeof cookieStore.set === "function";

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          if (!canSetCookies) {
            return;
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set?.({ name, value, ...options });
            } catch {
              // In app router server components, mutating cookies is not allowed.
              // Ignore set attempts since we only need read access here.
            }
          });
        },
      },
    }
  );
};
