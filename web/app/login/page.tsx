"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PageSpinner } from "@/components/loading";
import { isCognitoConfigured, UserNotConfirmedError } from "@/lib/auth";

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "session_expired") {
      toast.message("Your session expired. Please sign in again.");
    }
  }, [searchParams]);

  const loginMutation = useMutation({
    mutationFn: () => signIn(email, password),
    onSuccess: () => {
      const from = searchParams.get("from");
      router.push(from && from.startsWith("/") ? from : "/dashboard");
    },
    onError: (err) => {
      if (err instanceof UserNotConfirmedError) {
        toast.error(err.message);
        const params = new URLSearchParams({
          confirm: "1",
          email: err.email || email,
        });
        router.push(`/signup?${params.toString()}`);
        return;
      }
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate();
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex">
          <BrandLogo showTagline />
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access your applications and drafts.
          {!isCognitoConfigured() ? (
            <span className="mt-1 block text-amber-800">
              Cognito env vars not set — local mock auth is enabled.
            </span>
          ) : null}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Spinner className="size-4" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            href="/signup"
            className="text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
          {isCognitoConfigured() ? (
            <>
              {" "}
              ·{" "}
              <Link
                href={
                  email
                    ? `/signup?confirm=1&email=${encodeURIComponent(email)}`
                    : "/signup?confirm=1"
                }
                className="text-primary underline-offset-4 hover:underline"
              >
                Confirm email
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSpinner label="Loading sign in" />}>
      <LoginForm />
    </Suspense>
  );
}
