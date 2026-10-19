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
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour, such as #0B5FD6.");
export function contrastRatio(a:string,b:string){
  const luminance=(hex:string)=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;};
  const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}
export const themeDefaults = {
  secondary:"#FF7A45", soft:"#F0F3FA", surface:"#FFFFFF", muted:"#64646F", accentText:"#FFFFFF", secondaryText:"#28180E",
  darkBackground:"#0B0B0F", darkText:"#F5F5F7", darkAccent:"#4C9AFF", darkSecondary:"#FF925F", darkSurface:"#151519", darkSoft:"#202027", darkMuted:"#A9A9B5", darkAccentText:"#0B0B0F", darkSecondaryText:"#28180E",
  heroOverlay:"#10162B", heroText:"#FFFFFF", successColor:"#0B5FD6", errorColor:"#AA3441", darkSuccessColor:"#89B8FF", darkErrorColor:"#FFABB5",
} as const;
export const themeColorLabels:Record<keyof typeof themeDefaults,string> = {
  secondary:"Sunset highlight",soft:"Soft neutral tint",surface:"Card background",muted:"Secondary text",accentText:"Text on accent",secondaryText:"Text on sunset highlight",
  darkBackground:"Background",darkText:"Text",darkAccent:"Sapphire accent",darkSecondary:"Sunset highlight",darkSurface:"Card background",darkSoft:"Soft neutral tint",darkMuted:"Secondary text",darkAccentText:"Text on accent",darkSecondaryText:"Text on sunset highlight",
  heroOverlay:"Hero gradient",heroText:"Text on hero",successColor:"Success message",errorColor:"Error message",darkSuccessColor:"Success message",darkErrorColor:"Error message",
};
const themeColors=Object.fromEntries(Object.entries(themeDefaults).map(([key,value])=>[key,color.default(value)])) as {[K in keyof typeof themeDefaults]:z.ZodDefault<typeof color>};
export const settingsSchema = z.object({
  demoMode:z.boolean().default(false),
  ...themeColors,
  navCtaLabel:text(100).default(""),navCtaHref:url.or(z.string().regex(/^\/(?!\/)[a-zA-Z0-9/#?=_-]*$/)).default(""),
  businessName: text(120), tagline: text(300), logo: url, favicon: url,
  contactEmail: z.union([z.literal(""), z.email().max(254)]), phone, whatsapp: phone,
  address: text(600), sltda: text(100), currency: z.string().regex(/^[A-Z]{3}$/, "Use a three-letter currency code, such as USD."),
  socialLinks: z.array(z.object({ label: text(60).min(1, "Add a label."), url: url.refine(Boolean, "Add a URL.") })).max(12),
  seoTitle: text(160), seoDescription: text(320),
  accent: color, background: color, textColor: color,
  headingFont: z.enum(["system", "georgia", "arial"]), bodyFont: z.enum(["system", "georgia", "arial"]),
  radius: z.number().int().min(0).max(40), published: z.boolean(),
  siteUrl: url.default(""), ogImageId: z.uuid().nullable().default(null),
  publicReviews: z.boolean().default(false), inquiriesEnabled: z.boolean().default(true), cookieNoticeEnabled:z.boolean().default(true),
  ui: z.record(z.string().max(100),text(2000)).default({}),
  mapLatitude:z.number().min(-90).max(90).default(7.8731),mapLongitude:z.number().min(-180).max(180).default(80.7718),mapZoom:z.number().int().min(2).max(16).default(7),
}).refine((v) => !v.published || !!v.businessName, { path: ["businessName"], message: "Add the business name before publishing." }).superRefine((v,ctx)=>{
  if(v.published){
    const pairs=[['textColor','background'],['accent','background'],['muted','background'],['textColor','surface'],['muted','surface'],['accentText','accent'],['secondaryText','secondary'],['darkText','darkBackground'],['darkText','darkSurface'],['darkMuted','darkBackground'],['darkMuted','darkSurface'],['darkAccent','darkBackground'],['darkAccentText','darkAccent'],['darkSecondaryText','darkSecondary'],['heroText','heroOverlay'],['textColor','soft'],['muted','soft'],['darkText','darkSoft'],['darkMuted','darkSoft'],['successColor','surface'],['errorColor','surface'],['darkSuccessColor','darkSurface'],['darkErrorColor','darkSurface']] as const;
    for(const [fg,bg] of pairs)if(contrastRatio(v[fg],v[bg])<4.5)ctx.addIssue({code:"custom",path:[fg],message:`Needs 4.5:1 contrast against ${bg}.`});
  }
});
export type SiteSettings = z.infer<typeof settingsSchema>;
// Blank content and neutral editor defaults are not public brand content.
export const emptySettings: SiteSettings = {
  demoMode:false,
  ...themeDefaults, navCtaLabel:"",navCtaHref:"",
  businessName: "", tagline: "", logo: "", favicon: "", contactEmail: "", phone: "", whatsapp: "", address: "", sltda: "", currency: "USD",
  socialLinks: [], seoTitle: "", seoDescription: "", accent: "#0B5FD6", background: "#FBFBFD", textColor: "#1D1D1F",
  headingFont: "georgia", bodyFont: "system", radius: 24, published: false,
  siteUrl:"",ogImageId:null,publicReviews:false,inquiriesEnabled:true,cookieNoticeEnabled:true,ui:{},
  mapLatitude:7.8731,mapLongitude:80.7718,mapZoom:7,
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
