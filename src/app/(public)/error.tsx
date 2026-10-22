"use client";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
export default function PublicError({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <main className="public-section" role="alert">
      <h1>Something went wrong, please try again.</h1>
      <button
        className="public-button"
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
      >
        Try again
      </button>
    </main>
  );
}
