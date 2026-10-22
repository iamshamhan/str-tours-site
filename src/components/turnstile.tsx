"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
export function Turnstile({
  action,
  onToken,
  resetKey,
  label,
  errorLabel,
}: {
  action: "admin_login" | "trip_inquiry" | "public_review";
  onToken: (token: string) => void;
  resetKey: number;
  label: string;
  errorLabel: string;
}) {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    container = useRef<HTMLDivElement>(null),
    callback = useRef(onToken),
    [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);
  const ready = useCallback(() => setLoaded(true), []);
  useEffect(() => {
    const api = window.turnstile;
    if (!key || !api || !container.current) return;
    callback.current("");
    const id = api.render(container.current, {
      sitekey: key,
      action,
      theme: "auto",
      size: "flexible",
      callback: (token: string) => {
        setFailed(false);
        callback.current(token);
      },
      "expired-callback": () => callback.current(""),
      "error-callback": () => {
        callback.current("");
        setFailed(true);
      },
    });
    return () => {
      api.remove(id);
    };
  }, [key, action, loaded, resetKey]);
  if (!key) return null;
  return (
    <div className="challenge form-wide" role="group" aria-label={label}>
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={ready}
        onError={() => setFailed(true)}
      />
      <div ref={container} />
      {failed && errorLabel && <p role="alert">{errorLabel}</p>}
    </div>
  );
}
