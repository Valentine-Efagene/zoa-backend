"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { PageSpinner } from "@/components/loading";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!session.isAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, session, router]);

  if (loading || !session?.isAdmin) {
    return <PageSpinner label="Checking access" />;
  }

  return <>{children}</>;
}
