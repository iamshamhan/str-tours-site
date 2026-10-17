"use client";

import { useFormStatus } from "react-dom";
export function LogoutButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50">{pending ? "Signing out…" : "Log out"}</button>;
}
