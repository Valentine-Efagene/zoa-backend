"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { PageSpinner } from "@/components/loading";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      // Soft logout / never authenticated — leave the app shell.
      // Terminal expiry uses forceLogout() which hard-navigates with reason=session_expired.
      const params = new URLSearchParams();
      if (pathname && pathname !== "/login") {
        params.set("from", pathname);
      }
      const qs = params.toString();
      router.replace(qs ? `/login?${qs}` : "/login");
    }
  }, [loading, session, router, pathname]);

  if (loading || !session) {
    return <PageSpinner label="Checking session" />;
  }

  return <>{children}</>;
}
