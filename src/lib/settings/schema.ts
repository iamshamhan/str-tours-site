import { z } from "zod";

export const fonts = {
  system: { label: "System sans", css: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  georgia: { label: "Georgia serif", css: 'Georgia, "Times New Roman", serif' },
  arial: { label: "Arial sans", css: 'Arial, Helvetica, sans-serif' },
} as const;
const text = (max: number) => z.string().trim().max(max);
const url = text(2048).refine((value) => {
  if (!value) return true;
  try { const parsed = new URL(value); return parsed.protocol === "https:" && !parsed.username && !parsed.password; }
  catch { return false; }
}, "Enter a full HTTPS URL, or leave blank.");
const phone = text(32).refine((v) => !v || /^\+?[0-9 ()-]{7,32}$/.test(v), "Enter a valid phone number.");
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour, such as #476A63.");
export const settingsSchema = z.object({
  businessName: text(120), tagline: text(300), logo: url, favicon: url,
  contactEmail: z.union([z.literal(""), z.email().max(254)]), phone, whatsapp: phone,
  address: text(600), sltda: text(100), currency: z.string().regex(/^[A-Z]{3}$/, "Use a three-letter currency code, such as USD."),
  socialLinks: z.array(z.object({ label: text(60).min(1, "Add a label."), url: url.refine(Boolean, "Add a URL.") })).max(12),
  seoTitle: text(160), seoDescription: text(320),
  accent: color, background: color, textColor: color,
  headingFont: z.enum(["system", "georgia", "arial"]), bodyFont: z.enum(["system", "georgia", "arial"]),
  radius: z.number().int().min(0).max(40), published: z.boolean(),
}).refine((v) => !v.published || !!v.businessName, { path: ["businessName"], message: "Add the business name before publishing." });
export type SiteSettings = z.infer<typeof settingsSchema>;
// Blank content and neutral editor defaults are not public brand content.
export const emptySettings: SiteSettings = {
  businessName: "", tagline: "", logo: "", favicon: "", contactEmail: "", phone: "", whatsapp: "", address: "", sltda: "", currency: "USD",
  socialLinks: [], seoTitle: "", seoDescription: "", accent: "#476A63", background: "#FFFFFF", textColor: "#1D1D1F",
  headingFont: "system", bodyFont: "system", radius: 16, published: false,
};
export const SETTINGS_SLUG = "site-config";

type Row = { slug: string; value: unknown; published: boolean };
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function settingsForEditor(rows: Row[]): SiteSettings | null {
  const current = rows.find((r) => r.slug === SETTINGS_SLUG);
  if (current) {
    const result = settingsSchema.safeParse({ ...object(current.value), published: current.published });
    return result.success ? result.data : null;
  }
  const group = (slug: string) => object(rows.find((r) => r.slug === slug)?.value);
  const business = group("business"), contact = group("contact"), seo = group("seo-defaults"), theme = group("theme");
  const colors = object(theme.colors), layout = object(theme.layout);
  const raw = { ...emptySettings, businessName: business.name, tagline: business.tagline, currency: business.currency,
    contactEmail: contact.email, phone: contact.phone, whatsapp: contact.whatsapp_number, address: contact.address,
    seoTitle: seo.title, seoDescription: seo.description, accent: colors.accent, background: colors.background,
    textColor: colors.text, radius: layout.card_radius_px };
  const defined = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));
  const result = settingsSchema.safeParse({ ...emptySettings, ...defined });
  return result.success ? result.data : null;
}
