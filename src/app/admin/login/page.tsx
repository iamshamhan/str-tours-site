import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Administration</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">Sign in to manage your website.</p>
        <LoginForm />
      </section>
    </main>
  );
}
