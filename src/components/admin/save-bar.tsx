"use client";
import { useEffect } from "react";
export function UnsavedWarning({ dirty }: { dirty: boolean }) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => e.preventDefault();
    const navigate = (e: MouseEvent) => {
      const a = (e.target as Element)?.closest("a");
      if (
        !a ||
        a.target === "_blank" ||
        a.hasAttribute("download") ||
        a.getAttribute("href")?.startsWith("#") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      )
        return;
      if (a.href === location.href) return;
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);
  return null;
}
export function SaveBar({
  dirty,
  pending,
  disabled = false,
  label = "Save changes",
  message = "",
}: {
  dirty: boolean;
  pending: boolean;
  disabled?: boolean;
  label?: string;
  message?: string;
}) {
  return (
    <>
      <UnsavedWarning dirty={dirty} />
      <div className="admin-save-bar">
        <div>
          <strong>{dirty ? "Unsaved changes" : "Everything is up to date"}</strong>
          <small>
            {dirty
              ? "Save when you’re ready. Your edits are not live yet."
              : "Your saved content is ready to manage."}
          </small>
        </div>
        <button type="submit" disabled={pending || disabled} className="admin-primary">
          {disabled ? "Loading…" : pending ? "Saving…" : label}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      {message && (
        <p className="admin-toast" role="status" key={message}>
          {message}
        </p>
      )}
    </>
  );
}
