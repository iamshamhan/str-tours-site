"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fonts, settingsSchema, type SiteSettings } from "@/lib/settings/schema";
import { saveSettings } from "./actions";
import { MediaPicker } from "@/components/admin/media-library";

const groups = [
  { title: "Business identity", fields: [["businessName", "Business name"], ["tagline", "Tagline"], ["logo", "Logo"], ["favicon", "Favicon"], ["sltda", "SLTDA registration number"], ["currency", "Default currency"]] },
  { title: "Contact", fields: [["contactEmail", "Contact email"], ["phone", "Phone"], ["whatsapp", "WhatsApp number"], ["address", "Address"]] },
  { title: "Search engines", fields: [["seoTitle", "Default SEO title"], ["seoDescription", "Default SEO description"]] },
  { title: "Theme", fields: [["accent", "Accent colour"], ["background", "Background colour"], ["textColor", "Text colour"]] },
] as const;
const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<SiteSettings>({
    resolver: zodResolver(settingsSchema), defaultValues: initial,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "socialLinks" });
  function submit(values: SiteSettings) {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await saveSettings(values);
        setFeedback(result);
        if (result.ok) reset(values);
      } catch { setFeedback({ ok: false, message: "Unable to save. Check your connection and sign in again if your session expired." }); }
    });
  }
  function fieldError(name: FieldPath<SiteSettings>) {
    const error = errors[name as keyof SiteSettings];
    return error && "message" in error ? String(error.message) : undefined;
  }
  return <form className="mt-8 space-y-8" onSubmit={handleSubmit(submit)} noValidate onChange={() => setFeedback(null)}>
    <fieldset disabled={pending} className="space-y-8 disabled:opacity-60">
      {groups.map((group) => <section key={group.title} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">{group.title}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {group.fields.map(([name, label]) => <div key={name}>
            <label htmlFor={name} className="text-sm font-medium">{label}</label>
            <input id={name} {...register(name)} className={inputClass} aria-invalid={!!fieldError(name)} aria-describedby={fieldError(name) ? `${name}-error` : undefined} />
            {(name === "logo" || name === "favicon") && <MediaPicker imagesOnly onSelect={media => setValue(name, media.url, { shouldDirty:true, shouldValidate:true })}/>}
            {fieldError(name) && <p id={`${name}-error`} className="mt-1 text-sm text-red-700">{fieldError(name)}</p>}
          </div>)}
          {group.title === "Theme" && <>
            {(["headingFont", "bodyFont"] as const).map((name) => <div key={name}>
              <label htmlFor={name} className="text-sm font-medium">{name === "headingFont" ? "Heading font" : "Body font"}</label>
              <select id={name} {...register(name)} className={inputClass}>{Object.entries(fonts).map(([value, font]) => <option key={value} value={value}>{font.label}</option>)}</select>
            </div>)}
            <div><label htmlFor="radius" className="text-sm font-medium">Corner radius (0–40 px)</label>
              <input id="radius" type="number" min="0" max="40" {...register("radius", { valueAsNumber: true })} className={inputClass} aria-invalid={!!errors.radius} aria-describedby="radius-error" />
              <p id="radius-error" className="mt-1 text-sm text-red-700">{errors.radius?.message}</p>
            </div>
          </>}
        </div>
      </section>)}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Social links</h2>
        {fields.map((field, i) => <div key={field.id} className="mt-4 grid items-start gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <div><label htmlFor={`social-label-${i}`} className="text-sm">Label</label><input id={`social-label-${i}`} {...register(`socialLinks.${i}.label`)} className={inputClass} aria-describedby={`social-error-${i}`} /></div>
          <div><label htmlFor={`social-url-${i}`} className="text-sm">HTTPS URL</label><input id={`social-url-${i}`} {...register(`socialLinks.${i}.url`)} className={inputClass} aria-describedby={`social-error-${i}`} /></div>
          <button type="button" onClick={() => remove(i)} className="mt-8 rounded-lg border border-slate-300 px-3 py-2" aria-label={`Remove social link ${i + 1}`}>Remove</button>
          <p id={`social-error-${i}`} className="text-sm text-red-700 sm:col-span-3">{errors.socialLinks?.[i]?.label?.message || errors.socialLinks?.[i]?.url?.message}</p>
        </div>)}
        <button type="button" disabled={fields.length >= 12} onClick={() => append({ label: "", url: "" })} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50">Add social link</button>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <label className="flex items-center gap-3 font-medium"><input type="checkbox" {...register("published")} className="size-4" />Publish settings</label>
        <p className="mt-2 text-sm text-slate-600">Saving with this enabled makes these settings public immediately. Disabling it hides the settings and clears the public homepage. This is not a separate draft version.</p>
        <button type="submit" className="mt-5 rounded-lg bg-slate-900 px-5 py-3 font-medium text-white">{pending ? "Saving…" : "Save settings"}</button>
        {isDirty && <span className="ml-4 text-sm text-slate-500">Unsaved changes</span>}
      </section>
    </fieldset>
    {feedback && <p role={feedback.ok ? "status" : "alert"} className={feedback.ok ? "text-emerald-800" : "text-red-700"}>{feedback.message}</p>}
  </form>;
}
