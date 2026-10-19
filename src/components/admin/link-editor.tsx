"use client";

import { useRef, useState, useTransition, useSyncExternalStore } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editorSchema, type LinkEditorData } from "@/lib/navigation/schema";
import { saveLinks } from "@/app/admin/(protected)/navigation/actions";

const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2";
const button = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-40";
const subscribe = () => () => {};

export function LinkEditor({ initial }: { initial: LinkEditorData }) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [saved, setSaved] = useState(initial);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const dragged = useRef<{ index: number; x: number; y: number } | null>(null);
  const { register, control, handleSubmit, getValues, setValue, reset, formState: { errors, isDirty } } = useForm<LinkEditorData>({
    resolver: zodResolver(editorSchema), defaultValues: initial,
  });
  const { fields, append, remove, move } = useFieldArray({ control, name: "items", keyName: "fieldKey" });
  const items = useWatch({ control, name: "items" });
  const navigation = initial.kind === "navigation";
  function moveItem(from: number, to: number) { move(from, to); setFeedback(null); }
  function removeItem(index: number) {
    const current = getValues("items");
    const ids = [current[index].id, ...current.filter((item) => item.parent_id === current[index].id).map((item) => item.id)];
    setValue("deleted", [...new Set([...getValues("deleted"), ...ids])], { shouldDirty: true });
    remove(current.flatMap((item, i) => ids.includes(item.id) ? [i] : []));
    setFeedback({ ok: true, message: "Deletion staged (including any children). Save to apply, or discard changes to undo." });
  }
  function submit(values: LinkEditorData) {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await saveLinks(values);
        setFeedback(result);
        if (result.ok) {
          const next = result.saved ?? { ...values, deleted: [] };
          reset(next); setSaved(next);
        }
      } catch { setFeedback({ ok: false, message: "Unable to confirm the save. Check your connection and reload before retrying." }); }
    });
  }
  return <form method="post" onSubmit={handleSubmit(submit)} noValidate className="mt-6 space-y-6" onChange={() => setFeedback(null)}>
    <p className="text-sm leading-6 text-slate-600">Review seeded links before making them visible. Drag a handle or use Move up / Move down, then save. {navigation ? "Assign a top-level parent to create a dropdown child; hiding a parent hides its children." : "Links with the same group name appear together. Group order follows the first link in each group."} Changes and deletions take effect only when saved.</p>
    <fieldset disabled={pending || !ready} className="space-y-5 disabled:opacity-60">
      {fields.map((field, index) => <section key={field.fieldKey} data-link-index={index} className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" className={`${button} cursor-grab touch-none active:cursor-grabbing`} aria-label={`Drag item ${index + 1}`} onPointerDown={(event) => {
            if (event.button !== 0 || pending) return;
            dragged.current = { index, x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
          }} onPointerCancel={() => { dragged.current = null; }} onPointerUp={(event) => {
            const start = dragged.current; dragged.current = null;
            if (!start || pending || Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) return;
            const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-link-index]");
            if (target && event.currentTarget.closest("form")?.contains(target)) moveItem(start.index, Number(target.dataset.linkIndex));
          }}>↕</button>
          <span className="mr-auto text-sm font-medium">{index + 1}. {items[index]?.label || "New link"}</span>
          <button type="button" className={button} disabled={index === 0} onClick={() => moveItem(index, index - 1)} aria-label={`Move item ${index + 1} up`}>Move up</button>
          <button type="button" className={button} disabled={index === fields.length - 1} onClick={() => moveItem(index, index + 1)} aria-label={`Move item ${index + 1} down`}>Move down</button>
          <button type="button" className={`${button} text-red-700`} onClick={() => removeItem(index)} aria-label={`Delete item ${index + 1}`}>Delete</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["label", "href"] as const).map((key) => <div key={key}>
            <label htmlFor={`${field.id}-${key}`} className="text-sm font-medium">{key === "label" ? "Label" : "Link"}</label>
            <input id={`${field.id}-${key}`} {...register(`items.${index}.${key}`)} className={input} aria-invalid={!!errors.items?.[index]?.[key]} aria-describedby={`${field.id}-${key}-error`} />
            <p id={`${field.id}-${key}-error`} className="text-sm text-red-700">{errors.items?.[index]?.[key]?.message}</p>
          </div>)}
          {navigation ? <div>
            <label htmlFor={`${field.id}-parent`} className="text-sm font-medium">Dropdown parent</label>
            <select id={`${field.id}-parent`} {...register(`items.${index}.parent_id`, { setValueAs: (v) => v || null })} className={input} aria-describedby={`${field.id}-parent-error`}>
              <option value="">Top level</option>
              {items.filter((item) => !item.parent_id && item.id !== field.id).map((item) => <option key={item.id} value={item.id}>{item.label || "Untitled link"}</option>)}
            </select>
            <p id={`${field.id}-parent-error`} className="text-sm text-red-700">{errors.items?.[index]?.parent_id?.message}</p>
          </div> : <div>
            <label htmlFor={`${field.id}-group`} className="text-sm font-medium">Group name</label>
            <input id={`${field.id}-group`} {...register(`items.${index}.group_name`)} className={input} aria-describedby={`${field.id}-group-error`} />
            <p id={`${field.id}-group-error`} className="text-sm text-red-700">{errors.items?.[index]?.group_name?.message}</p>
          </div>}
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register(`items.${index}.published`)} />Visible</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register(`items.${index}.open_in_new_tab`)} />Open in new tab</label>
          </div>
        </div>
      </section>)}
      {!fields.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No links yet.</p>}
      <button type="button" className={button} disabled={fields.length >= 100} onClick={() => append({ id: crypto.randomUUID(), label: "", href: "", parent_id: null, group_name: "", published: false, open_in_new_tab: false })}>Add link</button>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{navigation ? "Public control labels" : "Footer text"}</h2>
        {(navigation ? ["menu_label", "close_label", "whatsapp_label"] as const : ["heading", "description", "copyright", "legal_notice"] as const).map((key) => <div key={key}>
          <label htmlFor={`copy-${key}`} className="text-sm font-medium">{{ menu_label: "Mobile menu label", close_label: "Close menu label", whatsapp_label: "WhatsApp button label", heading: "Heading", description: "Footer text", copyright: "Copyright text", legal_notice: "Legal text" }[key]}</label>
          <textarea id={`copy-${key}`} rows={key === "description" || key === "legal_notice" ? 3 : 1} {...register(`copy.${key}`)} className={input} aria-describedby={`copy-${key}-error`} />
          <p id={`copy-${key}-error`} className="text-sm text-red-700">{errors.copy?.[key]?.message}</p>
        </div>)}
        {!navigation && <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("copy.published")} />Publish footer text (link visibility is separate)</label>}
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="rounded-lg bg-slate-900 px-5 py-3 text-white">{pending ? "Saving…" : "Save changes"}</button>
        <button type="button" className={button} onClick={() => { reset(saved); setFeedback(null); }}>Discard changes</button>
        {isDirty && <span className="text-sm text-slate-600">Unsaved changes</span>}
      </div>
    </fieldset>
    {errors.items?.root?.message && <p role="alert" className="text-red-700">{errors.items.root.message}</p>}
    {feedback && <p role={feedback.ok ? "status" : "alert"} className={feedback.ok ? "text-emerald-800" : "text-red-700"}>{feedback.message}</p>}
  </form>;
}
