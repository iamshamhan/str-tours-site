"use client";
import { SaveBar } from "./save-bar";
import { useState, useTransition, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inquirySchema } from "@/lib/editor/schema";
import { saveInquiry } from "@/app/admin/(protected)/inquiries/actions";
const subscribe = () => () => {};
export function InquiryForm({ initial }: { initial: z.infer<typeof inquirySchema> }) {
  const search = useSearchParams();
  const ready = useSyncExternalStore(
      subscribe,
      () => true,
      () => false,
    ),
    router = useRouter(),
    [message, setMessage] = useState(
      search.get("saved") === "1" ? "Private notes and status saved." : "",
    ),
    [pending, start] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(inquirySchema), defaultValues: initial });
  return (
    <form
      method="post"
      onChange={() => setMessage("")}
      onSubmit={handleSubmit((value) =>
        start(async () => {
          try {
            const r = await saveInquiry(value);
            setMessage(r.message);
            if (r.ok) {
              reset(value);
              router.replace(`/admin/inquiries/${initial.id}?saved=1`);
              router.refresh();
            }
          } catch {
            setMessage("Save failed. Check your session and retry.");
          }
        }),
      )}
      className="space-y-4"
    >
      <fieldset disabled={pending || !ready} className="space-y-4">
        <label className="block">
          Status
          <select {...register("status")} className="admin-input">
            <option>new</option>
            <option>replied</option>
            <option>booked</option>
          </select>
        </label>
        <label className="block">
          Private notes
          <textarea rows={8} {...register("notes")} className="admin-input" />
        </label>
        {errors.notes && <p role="alert">{errors.notes.message}</p>}
      </fieldset>
      <SaveBar
        dirty={isDirty}
        pending={pending}
        disabled={!ready}
        message={message}
        label="Save inquiry"
      />
    </form>
  );
}
