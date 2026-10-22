"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "./confirm-button";
import { deleteRecord } from "@/app/admin/(protected)/[section]/actions";
export function RecordList({
  section,
  rows,
}: {
  section: string;
  rows: { id: string; title: string; published: boolean; updated_at: string; status?: string }[];
}) {
  const [message, setMessage] = useState(""),
    [pending, start] = useTransition();
  const router = useRouter(),
    shown = rows;
  return (
    <div className="space-y-3">
      <div className="admin-table-toolbar">
        <span>{shown.length} records on this page</span>
      </div>
      {message && (
        <p className="admin-toast" role="status">
          {message}
        </p>
      )}
      {shown.map((row) => (
        <article key={row.id} className="admin-record-row">
          <Link className="admin-record-title" href={`/admin/${section}/${row.id}`}>
            {row.title}
            <small>Open editor ↗</small>
          </Link>
          <span
            className={`status-badge status-${row.status ?? (row.published ? "published" : "draft")}`}
          >
            {row.status ?? (row.published ? "Published" : "Draft")}
          </span>
          <div className="row-actions">
            <Link className="admin-button" href={`/admin/${section}/${row.id}`}>
              Edit
            </Link>
            <ConfirmButton
              disabled={pending}
              onConfirm={() =>
                start(async () => {
                  try {
                    setMessage((await deleteRecord(section, row.id, row.updated_at)).message);
                    router.refresh();
                  } catch {
                    setMessage("Delete failed. Sign in and retry.");
                  }
                })
              }
            />
          </div>
        </article>
      ))}
      {!shown.length && (
        <div className="admin-empty">
          <span aria-hidden="true">◇</span>
          <h2>{rows.length ? "No matches on this page" : "A fresh start"}</h2>
          <p>
            {rows.length
              ? "Try another search or clear your filters."
              : "Add your first item to bring this section to life."}
          </p>
          <Link href={`/admin/${section}/new`} className="admin-primary">
            {rows.length ? "Add new item" : "Add your first item"} +
          </Link>
        </div>
      )}
    </div>
  );
}
