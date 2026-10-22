"use client";
import { useSyncExternalStore } from "react";
import type { Ui } from "@/lib/public/ui";
const subscribe = (notify: () => void) => {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    const r = document.documentElement;
    r.dataset.theme =
      r.dataset.preference === "system"
        ? mq.matches
          ? "dark"
          : "light"
        : (r.dataset.preference ?? "light");
    notify();
  };
  const storage = (e: StorageEvent) => {
    if (e.key !== "site-theme-v1") return;
    document.documentElement.dataset.preference =
      e.newValue === "dark" || e.newValue === "light" ? e.newValue : "system";
    sync();
  };
  mq.addEventListener("change", sync);
  window.addEventListener("storage", storage);
  window.addEventListener("site-theme-change", sync);
  return () => {
    mq.removeEventListener("change", sync);
    window.removeEventListener("storage", storage);
    window.removeEventListener("site-theme-change", sync);
  };
};
export function ThemeToggle({ labels }: { labels?: Ui }) {
  const mode = useSyncExternalStore(
      subscribe,
      () => document.documentElement.dataset.theme ?? "light",
      () => "light",
    ),
    copy = labels ?? { theme: "Appearance", light: "Light", dark: "Dark" };
  if (!copy.theme) return null;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={mode === "dark"}
      aria-label={copy.theme}
      title={mode === "dark" ? copy.light : copy.dark}
      className="theme-toggle"
      onClick={() => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.preference = next;
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("site-theme-v1", next);
        } catch {}
        window.dispatchEvent(new Event("site-theme-change"));
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-orbit">
        <g className="sun-rays" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </g>
        <circle className="sun-disc" cx="12" cy="12" r="4.2" fill="currentColor" />
        <path
          className="moon-disc"
          d="M19.6 15.1A8.2 8.2 0 0 1 8.9 4.4 8.3 8.3 0 1 0 19.6 15.1Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
