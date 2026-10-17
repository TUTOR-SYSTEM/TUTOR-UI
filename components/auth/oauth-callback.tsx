"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/components/providers/auth.provider";
import { useAuthCopy } from "@/hooks/useAuthCopy.hook";
import { consumeOAuthAttempt } from "@/lib/oauth";
import { AuthCardShell } from "./auth-ui";

export function OAuthCallback() {
  const router = useRouter();
  const { startSession } = useAuth();
  const { oauthCallback: t } = useAuthCopy();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }
    handled.current = true;

    // Gateway trả access token trong URL fragment (không gửi lên server). Refresh token là
    // cookie httpOnly do gateway set, không xuất hiện ở đây. Xóa fragment ngay.
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("accessToken");
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );

    // Chỉ nhận token khi chính tab này vừa bắt đầu luồng OAuth (xem lib/oauth.ts).
    const initiatedHere = consumeOAuthAttempt();
    if (!accessToken || !initiatedHere) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    startSession(accessToken);
    router.replace("/");
  }, [startSession, router]);

  return (
    <AuthCardShell
      icon={<Loader2 className="size-6 animate-spin" aria-hidden />}
      title={t.title}
      subtitle={t.subtitle}
      showBadge={false}
    >
      <p className="py-4 text-center text-sm text-slate-500">
        {t.waitMessage}
      </p>
    </AuthCardShell>
  );
}

export default OAuthCallback;
