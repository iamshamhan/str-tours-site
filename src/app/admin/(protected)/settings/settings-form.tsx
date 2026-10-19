"use client";

import { useState, useTransition } from "react";
import { Controller, useFieldArray, useForm,useWatch, type FieldPath } from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { fonts, themeDefaults, themeColorLabels, settingsSchema, type SiteSettings } from "@/lib/settings/schema";
import { saveSettings } from "./actions";
import { MediaPicker } from "@/components/admin/media-library";
import { UnsavedWarning } from "@/components/admin/save-bar";
import { uiKeys } from "@/lib/public/ui";

const groups = [
  { title: "Business identity", fields: [["businessName", "Business name"], ["tagline", "Tagline"], ["logo", "Logo"], ["favicon", "Favicon"], ["sltda", "SLTDA registration number"], ["currency", "Default currency"]] },
  { title: "Contact", fields: [["contactEmail", "Contact email"], ["phone", "Phone"], ["whatsapp", "WhatsApp number"], ["address", "Address"]] },
  { title: "Search engines", fields: [["siteUrl", "Public site URL (HTTPS)"], ["seoTitle", "Default SEO title"], ["seoDescription", "Default SEO description"]] },
  { title: "Theme", fields: [["accent", "Accent colour"], ["background", "Background colour"], ["textColor", "Text colour"]] },
] as const;
const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<z.input<typeof settingsSchema>,unknown,SiteSettings>({
    resolver: zodResolver(settingsSchema), defaultValues: initial,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "socialLinks" });
  const selectedOg=useWatch({control,name:"ogImageId"});
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
  return <form method="post" className="mt-8 space-y-8" onSubmit={handleSubmit(submit,()=>setFeedback({ok:false,message:"Check the highlighted fields before saving."}))} noValidate onChange={() => setFeedback(null)}>
    <UnsavedWarning dirty={isDirty}/><fieldset disabled={pending} className="space-y-8 disabled:opacity-60">
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
      <section className="admin-form-card"><h2>Colour palettes</h2><p className="admin-helper">Preview with the appearance menu. Text and button colours must pass contrast checks before publishing.</p>{[false,true].map(dark=><details key={String(dark)} open={!dark} className="palette-group"><summary>{dark?"Dark palette":"Light palette and hero"}</summary><div className="grid gap-5 sm:grid-cols-3">{(Object.keys(themeDefaults) as (keyof typeof themeDefaults)[]).filter(key=>key.startsWith("dark")===dark).map(key=><Controller key={key} name={key} control={control} render={({field,fieldState})=><div><label htmlFor={`palette-${key}`}>{themeColorLabels[key]}</label><div className="color-field"><input type="color" value={/^#[a-fA-F0-9]{6}$/.test(field.value??"")?field.value:themeDefaults[key]} onChange={field.onChange} onBlur={field.onBlur} aria-label={`${themeColorLabels[key]} ${dark?"dark":"light"}`}/><input id={`palette-${key}`} ref={field.ref} value={field.value??""} onChange={field.onChange} onBlur={field.onBlur} aria-invalid={!!fieldState.error} aria-label={`${themeColorLabels[key]} hex ${dark?"dark":"light"}`}/></div>{fieldState.error&&<small role="alert">{fieldState.error.message}</small>}</div>}/>) }</div></details>)}<div className="grid gap-5 sm:grid-cols-2"><label>Navigation button label<input {...register("navCtaLabel")} className={inputClass}/></label><label>Navigation button destination<input {...register("navCtaHref")} className={inputClass}/>{errors.navCtaHref&&<small role="alert">{errors.navCtaHref.message}</small>}</label></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Public forms and search previews</h2>
        <label className="flex gap-3"><input type="checkbox" {...register("demoMode")}/>Demo notice and noindex (keep enabled while sample content is public)</label>
        <label className="flex gap-3"><input type="checkbox" {...register("inquiriesEnabled")}/>Enable trip inquiries</label>
        <label className="flex gap-3"><input type="checkbox" {...register("publicReviews")}/>Allow public review submissions (pending until approved)</label>
        <label className="flex gap-3"><input type="checkbox" {...register("cookieNoticeEnabled")}/>Show essential-cookie notice</label>
        <p>Default Open Graph image: {selectedOg?"Selected":"None"}</p>
        <MediaPicker imagesOnly onSelect={m=>setValue("ogImageId",m.id,{shouldDirty:true})}/>
        <button type="button" className="admin-button" onClick={()=>setValue("ogImageId",null,{shouldDirty:true})}>Remove image</button>
        <div className="grid gap-3 sm:grid-cols-3">{(["mapLatitude","mapLongitude","mapZoom"] as const).map(name=><label key={name}>{name.replace(/([A-Z])/g," $1")}<input type="number" step="any" {...register(name,{valueAsNumber:true})} className={inputClass}/>{errors[name]&&<span className="text-red-700">{errors[name]?.message}</span>}</label>)}</div>
      </section>
      <details className="rounded-2xl border border-slate-200 bg-white p-6">
        <summary className="cursor-pointer text-lg font-semibold">Public interface and form text</summary>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{uiKeys.map(key=><label key={key} className="block text-sm">{key.replace(/([A-Z])/g," $1")}<textarea rows={2} {...register(`ui.${key}`)} className={inputClass}/>{errors.ui?.[key]&&<span className="text-red-700">{String(errors.ui[key]?.message??"Invalid text")}</span>}</label>)}</div>
      </details>
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
      <section className="admin-save-bar">
        <label className="flex items-center gap-3 font-medium"><input type="checkbox" {...register("published")} className="size-4" />Publish settings</label>
        <p className="mt-2 text-sm text-slate-600">Saving with this enabled makes these settings public immediately. Disabling it hides the settings and clears the public homepage. This is not a separate draft version.</p>
        <button type="submit" className="mt-5 rounded-lg bg-slate-900 px-5 py-3 font-medium text-white">{pending ? "Saving…" : "Save settings"}</button>
        {isDirty && <span className="ml-4 text-sm text-slate-500">Unsaved changes</span>}
      </section>
    </fieldset>
    {feedback && <p role={feedback.ok ? "status" : "alert"} className={feedback.ok ? "text-emerald-800" : "text-red-700"}>{feedback.message}</p>}
  </form>;
}
