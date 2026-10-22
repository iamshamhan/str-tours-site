"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LOGIN_ERROR, type LoginValues } from "@/lib/admin/login-schema";
import { loginAction } from "./actions";
import { Turnstile } from "@/components/turnstile";
const subscribe = () => () => {};

export function LoginForm() {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const [challengeToken, setChallengeToken] = useState(""),
    [challengeReset, setChallengeReset] = useState(0);
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: LoginValues) {
    setError("");
    try {
      const result = await loginAction({ ...values, challengeToken });
      if (result.ok) {
        setRedirecting(true);
        router.replace("/admin");
        router.refresh();
        return;
      }
      setError(result.error || LOGIN_ERROR);
    } catch {
      setError(LOGIN_ERROR);
    }
    resetField("password");
    setChallengeToken("");
    setChallengeReset((v) => v + 1);
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit(submit)}
      noValidate
      className="mt-8 space-y-5"
      aria-busy={isSubmitting}
    >
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200"
        />
        {errors.email ? (
          <p id="email-error" className="mt-2 text-sm text-red-700">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200"
        />
        {errors.password ? (
          <p id="password-error" className="mt-2 text-sm text-red-700">
            {errors.password.message}
          </p>
        ) : null}
      </div>
      <Turnstile
        action="admin_login"
        onToken={setChallengeToken}
        resetKey={challengeReset}
        label="Security verification"
        errorLabel="Verification unavailable. Reload and try again."
      />
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <button
        disabled={
          !ready ||
          isSubmitting ||
          redirecting ||
          (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !challengeToken)
        }
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting || redirecting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
