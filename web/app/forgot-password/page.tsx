"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import {
  confirmForgotPassword,
  forgotPassword,
  isCognitoConfigured,
  isMockAuthEmailEnabled,
  signIn,
} from "@/lib/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const requestMutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: () => {
      setStep("confirm");
      toast.success("If an account exists, we sent a reset code to your email");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not send reset code");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      await confirmForgotPassword(email, code, newPassword);
      await signIn(email, newPassword);
    },
    onSuccess: () => {
      toast.success("Password updated");
      router.push("/dashboard");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not reset password");
    },
  });

  const pending = requestMutation.isPending || confirmMutation.isPending;

  function onRequest(e: React.FormEvent) {
    e.preventDefault();
    requestMutation.mutate();
  }

  function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    confirmMutation.mutate();
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex">
          <BrandLogo showTagline />
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {step === "request" ? "Forgot password" : "Reset password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === "request"
            ? "Enter your account email and we will send a verification code."
            : `Enter the code sent to ${email} and choose a new password.`}
          {!isCognitoConfigured() && !isMockAuthEmailEnabled() ? (
            <span className="mt-1 block text-amber-800">
              Password reset requires Cognito or UAT mock email (Mailpit).
            </span>
          ) : null}
        </p>

        {step === "request" ? (
          <form onSubmit={onRequest} className="mt-8 space-y-5">
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
            <Button type="submit" className="w-full" disabled={pending}>
              {requestMutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Sending…
                </>
              ) : (
                "Send reset code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={onConfirm} className="mt-8 space-y-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="code">Verification code</FieldLabel>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="newPassword">New password</FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <Button type="submit" className="w-full" disabled={pending}>
              {confirmMutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Updating…
                </>
              ) : (
                "Update password and sign in"
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
