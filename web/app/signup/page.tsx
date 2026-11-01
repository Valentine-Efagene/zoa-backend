"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  confirmSignUp,
  isCognitoConfigured,
  resendConfirmationCode,
  signIn,
  signUp,
} from "@/lib/auth";

const RESEND_COOLDOWN_MS = 60_000;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"register" | "confirm">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [code, setCode] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
    if (searchParams.get("confirm") === "1") {
      setStep("confirm");
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendAvailableAt <= Date.now()) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [resendAvailableAt]);

  const registerMutation = useMutation({
    mutationFn: () => signUp({ email, password, givenName, familyName }),
    onSuccess: async (result) => {
      if (result.needsConfirmation) {
        setStep("confirm");
        setResendAvailableAt(Date.now() + RESEND_COOLDOWN_MS);
        toast.success("Check your email for a confirmation code");
      } else {
        await signIn(email, password);
        router.push("/dashboard");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      await confirmSignUp(email, code);
      await signIn(email, password);
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Confirmation failed");
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendConfirmationCode(email),
    onSuccess: () => {
      setResendAvailableAt(Date.now() + RESEND_COOLDOWN_MS);
      toast.success("A new confirmation code was sent to your email");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not resend code");
    },
  });

  function onRegister(e: React.FormEvent) {
    e.preventDefault();
    registerMutation.mutate();
  }

  function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    confirmMutation.mutate();
  }

  const pending =
    registerMutation.isPending ||
    confirmMutation.isPending ||
    resendMutation.isPending;

  const resendSecondsLeft = Math.max(
    0,
    Math.ceil((resendAvailableAt - Date.now()) / 1000),
  );

  const needsPasswordOnConfirm = step === "confirm" && !password;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex">
          <BrandLogo showTagline />
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {step === "register" ? "Create account" : "Confirm email"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === "register"
            ? "Start filing company and trustees registrations."
            : `Enter the confirmation code sent to ${email}. Check spam or promotions if you do not see it.`}
          {!isCognitoConfigured() ? (
            <span className="mt-1 block text-amber-800">
              Cognito env vars not set — local mock auth is enabled.
            </span>
          ) : null}
        </p>

        {step === "register" ? (
          <form onSubmit={onRegister} className="mt-8 space-y-5">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="givenName">First name</FieldLabel>
                  <Input
                    id="givenName"
                    required
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="familyName">Surname</FieldLabel>
                  <Input
                    id="familyName"
                    required
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <Button type="submit" className="w-full" disabled={pending}>
              {registerMutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Creating…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={onConfirm} className="mt-8 space-y-5">
            <Field>
              <FieldLabel htmlFor="confirmEmail">Email</FieldLabel>
              <Input
                id="confirmEmail"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            {needsPasswordOnConfirm ? (
              <Field>
                <FieldLabel htmlFor="confirmPassword">Password</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="code">Confirmation code</FieldLabel>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={pending}>
              {confirmMutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Confirming…
                </>
              ) : (
                "Confirm and continue"
              )}
            </Button>
            {isCognitoConfigured() ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={pending || !email || resendSecondsLeft > 0}
                onClick={() => resendMutation.mutate()}
              >
                {resendMutation.isPending ? (
                  <>
                    <Spinner className="size-4" />
                    Sending…
                  </>
                ) : resendSecondsLeft > 0 ? (
                  `Resend code in ${resendSecondsLeft}s`
                ) : (
                  "Resend confirmation code"
                )}
              </Button>
            ) : null}
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<PageSpinner label="Loading sign up" />}>
      <SignupForm />
    </Suspense>
  );
}
